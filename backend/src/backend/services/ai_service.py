import os
import json
import re
from functools import lru_cache

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


@lru_cache(maxsize=1)
def get_client() -> OpenAI:
    """Create the NVIDIA OpenAI-compatible client lazily."""
    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        raise RuntimeError(
            "NVIDIA_API_KEY is not set. Add it to backend/.env or your environment."
        )
    return OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key,
    )

def _clean_json_string(raw: str) -> str:
    """Extracts JSON even if wrapped in markdown codeblocks or thinking tags."""
    # Remove thinking tags if present
    cleaned = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL).strip()
    
    # Extract markdown block if present
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if match:
        return match.group(1).strip()
    
    # Otherwise find the outermost JSON braces
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        return cleaned[start : end + 1].strip()
    
    return cleaned

def extract_legal_nodes(document_text: str) -> dict:
    """
    Parses legal text into Suika's 5-fragment schema for the Z3 solver.
    """
    client = get_client()

    system_prompt = (
        "You are Suika's legal symbolic extractor. Decompose the case into concise first-order logic terms.\n"
        "Return ONLY a clean JSON object without backticks, prose, or explanations.\n"
        "Strict format:\n"
        "{\n"
        '  "question": "Concise main legal issue",\n'
        '  "observations": ["snake_case_fact_1", "snake_case_fact_2"],\n'
        '  "constraints": [\n'
        "    {\n"
        '      "id": "rule_identifier",\n'
        '      "premise": ["snake_case_fact_1"],\n'
        '      "conclusion": "snake_case_claim",\n'
        '      "negate_conclusion": true\n'
        "    }\n"
        "  ],\n"
        '  "ideas": ["potential_defense_or_tolling"],\n'
        '  "conclusions": ["final_legal_holding"]\n'
        "}\n"
        "Keep observations and constraints limited to 3-5 high-relevance items to avoid truncation."
    )

    completion = client.chat.completions.create(
        model="z-ai/glm-5.3",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Case Text:\n{document_text}"}
        ],
        temperature=0.1,
        max_tokens=4096,  # Bumped to prevent unterminated string crashes
        response_format={"type": "json_object"},
        stream=False
    )

    raw_content = completion.choices[0].message.content or "{}"
    cleaned = _clean_json_string(raw_content)

    try:
        return json.loads(cleaned)
    except Exception as e:
        return {
            "question": "Failed to parse structured JSON",
            "observations": ["raw_extraction_error"],
            "constraints": [],
            "ideas": [],
            "conclusions": [f"Parse error: {str(e)}", f"Raw: {raw_content[:200]}"]
        }