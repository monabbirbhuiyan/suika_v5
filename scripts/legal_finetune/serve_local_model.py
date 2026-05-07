#!/usr/bin/env python3
"""Serve a local Hugging Face causal LM with an OpenAI-compatible chat endpoint.

This lets the Next.js app reuse its existing OpenAI-style client path by pointing
AI_PROVIDER=local at http://127.0.0.1:8000/v1.
"""

from __future__ import annotations

import argparse
import time
import uuid
from typing import Literal

import torch
import uvicorn
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from transformers import AutoModelForCausalLM, AutoTokenizer

app = FastAPI(title="Suika Local Legal Model", version="1.0.0")

MODEL = None
TOKENIZER = None
MODEL_ID = "artifacts/legal-cpt-3050ti"
DEVICE = "cpu"


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(min_length=1)


class ChatCompletionRequest(BaseModel):
    model: str | None = None
    messages: list[ChatMessage]
    temperature: float = 0.7
    max_tokens: int = 512
    stream: bool = False


def build_prompt(messages: list[ChatMessage]) -> str:
    assert TOKENIZER is not None

    prompt_messages = [
        {"role": message.role, "content": message.content} for message in messages
    ]

    chat_template = getattr(TOKENIZER, "chat_template", None)
    if chat_template:
        return TOKENIZER.apply_chat_template(
            prompt_messages,
            tokenize=False,
            add_generation_prompt=True,
        )

    lines: list[str] = []
    for message in messages:
        lines.append(f"{message.role.upper()}: {message.content.strip()}")
    lines.append("ASSISTANT:")
    return "\n\n".join(lines)


def load_model(model_id: str, precision: str) -> None:
    global MODEL, TOKENIZER, MODEL_ID, DEVICE

    MODEL_ID = model_id
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

    if DEVICE == "cuda":
        if precision == "bf16" and torch.cuda.is_bf16_supported():
            dtype = torch.bfloat16
        elif precision in {"bf16", "fp16", "auto"}:
            dtype = torch.float16
        else:
            dtype = torch.float32
    else:
        dtype = torch.float32

    TOKENIZER = AutoTokenizer.from_pretrained(model_id, use_fast=True)
    if TOKENIZER.pad_token is None:
        TOKENIZER.pad_token = TOKENIZER.eos_token

    MODEL = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=dtype,
    )
    MODEL.to(DEVICE)
    MODEL.eval()


@app.get("/health")
def health_check() -> dict:
    return {"ok": True, "model": MODEL_ID, "device": DEVICE}


@app.get("/v1/models")
def list_models() -> dict:
    return {
        "object": "list",
        "data": [
            {
                "id": MODEL_ID,
                "object": "model",
                "owned_by": "local",
            }
        ],
    }


@app.post("/v1/chat/completions")
def create_chat_completion(
    request: ChatCompletionRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    del authorization

    if request.stream:
        raise HTTPException(status_code=400, detail="stream=true is not supported")

    if MODEL is None or TOKENIZER is None:
        raise HTTPException(status_code=503, detail="Model is not loaded")

    if not request.messages:
        raise HTTPException(status_code=400, detail="messages must not be empty")

    prompt = build_prompt(request.messages)
    encoded = TOKENIZER(prompt, return_tensors="pt")
    encoded = {key: value.to(DEVICE) for key, value in encoded.items()}

    input_length = encoded["input_ids"].shape[1]
    max_new_tokens = max(1, min(request.max_tokens, 1024))
    temperature = max(0.0, min(request.temperature, 2.0))
    do_sample = temperature > 0

    with torch.inference_mode():
        output_ids = MODEL.generate(
            **encoded,
            max_new_tokens=max_new_tokens,
            temperature=temperature if do_sample else 1.0,
            do_sample=do_sample,
            pad_token_id=TOKENIZER.pad_token_id,
            eos_token_id=TOKENIZER.eos_token_id,
        )

    generated_ids = output_ids[0][input_length:]
    text = TOKENIZER.decode(generated_ids, skip_special_tokens=True).strip()

    now = int(time.time())
    completion_id = f"chatcmpl-{uuid.uuid4().hex}"

    return {
        "id": completion_id,
        "object": "chat.completion",
        "created": now,
        "model": request.model or MODEL_ID,
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": text,
                },
                "finish_reason": "stop",
            }
        ],
        "usage": {
            "prompt_tokens": input_length,
            "completion_tokens": len(generated_ids),
            "total_tokens": input_length + len(generated_ids),
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Serve a local fine-tuned model.")
    parser.add_argument(
        "--model-dir",
        default="artifacts/legal-cpt-3050ti",
        help="Path to the fine-tuned Hugging Face model directory.",
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument(
        "--precision",
        choices=["auto", "fp16", "bf16", "fp32"],
        default="auto",
        help="Inference precision. fp16 is recommended on RTX 3050 Ti.",
    )

    args = parser.parse_args()
    load_model(args.model_dir, args.precision)
    uvicorn.run(app, host=args.host, port=args.port)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
