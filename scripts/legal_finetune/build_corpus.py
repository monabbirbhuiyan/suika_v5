#!/usr/bin/env python3
"""Build a clean text corpus from CourtListener raw JSONL.

This prepares text-only training data for continued pretraining (CPT),
so the model is tuned on CourtListener text only.
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
from typing import Dict, Iterable, List, Optional

WHITESPACE_RE = re.compile(r"\s+")
TAG_RE = re.compile(r"<[^>]+>")

TEXT_FIELD_CANDIDATES = (
    "plain_text",
    "html_with_citations",
    "html_lawbox",
    "text",
    "snippet",
)

TITLE_FIELD_CANDIDATES = (
    "case_name_full",
    "case_name",
    "absolute_url",
)


def normalize_text(value: str) -> str:
    without_tags = TAG_RE.sub(" ", value)
    collapsed = WHITESPACE_RE.sub(" ", without_tags)
    return collapsed.strip()


def choose_first(record: Dict, keys: Iterable[str]) -> str:
    for key in keys:
        value = record.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def extract_text(record: Dict) -> str:
    text = choose_first(record, TEXT_FIELD_CANDIDATES)
    if not text:
        return ""
    return normalize_text(text)


def extract_title(record: Dict) -> str:
    return choose_first(record, TITLE_FIELD_CANDIDATES)


def to_training_text(record: Dict) -> str:
    title = extract_title(record)
    body = extract_text(record)
    if not body:
        return ""

    if title:
        return f"Title: {title}\n\n{body}"
    return body


def iter_jsonl(path: pathlib.Path):
    with path.open("r", encoding="utf-8") as f:
        for line_number, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                yield line_number, json.loads(line)
            except json.JSONDecodeError as exc:
                raise RuntimeError(f"Invalid JSONL at line {line_number}: {exc}") from exc


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare CourtListener text corpus.")
    parser.add_argument(
        "--input-jsonl",
        default="data/courtlistener/raw/opinions.jsonl",
        help="Input raw JSONL from courtlistener_fetch.py",
    )
    parser.add_argument(
        "--output-jsonl",
        default="data/courtlistener/prepared/train_corpus.jsonl",
        help="Output JSONL file with {'text': ...} objects.",
    )
    parser.add_argument(
        "--output-txt",
        default="data/courtlistener/prepared/train_corpus.txt",
        help="Output plain text corpus (documents separated by blank lines).",
    )
    parser.add_argument(
        "--min-chars",
        type=int,
        default=800,
        help="Minimum normalized characters required per document.",
    )

    args = parser.parse_args()

    input_path = pathlib.Path(args.input_jsonl)
    if not input_path.exists():
        raise FileNotFoundError(f"Input JSONL not found: {input_path}")

    output_jsonl = pathlib.Path(args.output_jsonl)
    output_txt = pathlib.Path(args.output_txt)
    output_jsonl.parent.mkdir(parents=True, exist_ok=True)
    output_txt.parent.mkdir(parents=True, exist_ok=True)

    total = 0
    kept = 0

    with output_jsonl.open("w", encoding="utf-8") as f_jsonl, output_txt.open(
        "w", encoding="utf-8"
    ) as f_txt:
        for _line_no, record in iter_jsonl(input_path):
            total += 1
            training_text = to_training_text(record)
            if len(training_text) < args.min_chars:
                continue

            row = {"text": training_text}
            f_jsonl.write(json.dumps(row, ensure_ascii=False) + "\n")
            f_txt.write(training_text)
            f_txt.write("\n\n")
            kept += 1

    print(f"Processed: {total}")
    print(f"Kept: {kept}")
    print(f"JSONL: {output_jsonl}")
    print(f"Text: {output_txt}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
