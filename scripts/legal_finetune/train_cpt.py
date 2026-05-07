#!/usr/bin/env python3
"""Continued pretraining (CPT) on CourtListener-only corpus.

This script trains a causal LM on text documents from your prepared JSONL corpus.
It does not mix external datasets unless you add them manually.
"""

from __future__ import annotations

import argparse

from datasets import load_dataset
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    DataCollatorForLanguageModeling,
    Trainer,
    TrainingArguments,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="CPT on CourtListener corpus JSONL.")
    parser.add_argument(
        "--model",
        required=True,
        help="Base model id or local path, e.g. meta-llama/Llama-3.2-1B",
    )
    parser.add_argument(
        "--train-jsonl",
        default="data/courtlistener/prepared/train_corpus.jsonl",
        help="Prepared corpus JSONL with a 'text' field.",
    )
    parser.add_argument(
        "--output-dir",
        default="artifacts/legal-cpt",
        help="Output directory for checkpoints and final model.",
    )
    parser.add_argument("--max-length", type=int, default=1024)
    parser.add_argument("--batch-size", type=int, default=1)
    parser.add_argument("--grad-accum", type=int, default=16)
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--lr", type=float, default=2e-5)
    parser.add_argument(
        "--precision",
        choices=["auto", "fp16", "bf16", "fp32"],
        default="auto",
        help="Training precision. For RTX 3050 Ti, fp16 is usually best.",
    )
    parser.add_argument(
        "--gradient-checkpointing",
        action="store_true",
        default=True,
        help="Enable gradient checkpointing to reduce VRAM usage (default: on).",
    )
    parser.add_argument(
        "--no-gradient-checkpointing",
        dest="gradient_checkpointing",
        action="store_false",
        help="Disable gradient checkpointing.",
    )

    args = parser.parse_args()

    if args.precision == "auto":
        use_bf16 = torch.cuda.is_available() and torch.cuda.is_bf16_supported()
        use_fp16 = torch.cuda.is_available() and not use_bf16
    elif args.precision == "bf16":
        use_bf16 = True
        use_fp16 = False
    elif args.precision == "fp16":
        use_bf16 = False
        use_fp16 = True
    else:
        use_bf16 = False
        use_fp16 = False

    dataset = load_dataset("json", data_files={"train": args.train_jsonl})

    tokenizer = AutoTokenizer.from_pretrained(args.model, use_fast=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    def tokenize(batch):
        return tokenizer(
            batch["text"],
            truncation=True,
            max_length=args.max_length,
            padding="max_length",
        )

    tokenized = dataset.map(
        tokenize,
        batched=True,
        remove_columns=dataset["train"].column_names,
        desc="Tokenizing corpus",
    )

    if use_fp16:
        model_dtype = torch.float16
    elif use_bf16:
        model_dtype = torch.bfloat16
    else:
        model_dtype = torch.float32

    model = AutoModelForCausalLM.from_pretrained(args.model, torch_dtype=model_dtype)

    if args.gradient_checkpointing:
        model.gradient_checkpointing_enable()
        model.config.use_cache = False

    training_args = TrainingArguments(
        output_dir=args.output_dir,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        num_train_epochs=args.epochs,
        learning_rate=args.lr,
        warmup_ratio=0.03,
        logging_steps=10,
        save_steps=200,
        save_total_limit=2,
        fp16=use_fp16,
        bf16=use_bf16,
        gradient_checkpointing=args.gradient_checkpointing,
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized["train"],
        data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False),
    )

    trainer.train()
    trainer.save_model(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)

    print(f"Saved model to {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
