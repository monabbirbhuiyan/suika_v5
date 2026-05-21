#!/usr/bin/env python3
"""Fetch CourtListener REST v4 records and save them as JSONL.

Usage example:
  set COURTLISTENER_API_TOKEN=your_token
  python scripts/legal_finetune/courtlistener_fetch.py ^
    --endpoint https://www.courtlistener.com/api/rest/v4/opinions/ ^
    --param court=scotus ^
    --param date_filed__gte=2018-01-01 ^
    --max-records 20000
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Dict, Iterable, Optional, Tuple

BASE_HEADERS = {
    "Accept": "application/json",
    "User-Agent": "suika-legal-finetune/1.0",
}


def parse_key_value(items: Iterable[str]) -> Dict[str, str]:
    result: Dict[str, str] = {}
    for item in items:
        if "=" not in item:
            raise ValueError(f"Invalid --param '{item}'. Expected key=value.")
        key, value = item.split("=", 1)
        key = key.strip()
        if not key:
            raise ValueError(f"Invalid --param '{item}'. Empty key.")
        result[key] = value
    return result


def build_start_url(endpoint: str, params: Dict[str, str], page_size: int) -> str:
    query = dict(params)
    query.setdefault("page_size", str(page_size))
    parts = urllib.parse.urlparse(endpoint)
    existing = urllib.parse.parse_qs(parts.query)
    for key, values in existing.items():
        if values:
            query.setdefault(key, values[-1])
    new_query = urllib.parse.urlencode(query)
    return urllib.parse.urlunparse(
        (parts.scheme, parts.netloc, parts.path, parts.params, new_query, parts.fragment)
    )


def normalize_params_for_endpoint(endpoint: str, params: Dict[str, str]) -> Dict[str, str]:
    """Map common shorthand filters to valid joined filters for known endpoints."""
    normalized = dict(params)
    path = urllib.parse.urlparse(endpoint).path.rstrip("/")

    # Opinions are nested under clusters -> dockets -> courts.
    if path.endswith("/opinions"):
        if "court" in normalized and "cluster__docket__court" not in normalized:
            normalized["cluster__docket__court"] = normalized.pop("court")
            print(
                "Mapped filter 'court' to 'cluster__docket__court' for opinions endpoint."
            )

        if "date_filed__gte" in normalized and "cluster__date_filed__gte" not in normalized:
            normalized["cluster__date_filed__gte"] = normalized.pop("date_filed__gte")
            print(
                "Mapped filter 'date_filed__gte' to 'cluster__date_filed__gte' for opinions endpoint."
            )

        if "date_filed__lte" in normalized and "cluster__date_filed__lte" not in normalized:
            normalized["cluster__date_filed__lte"] = normalized.pop("date_filed__lte")
            print(
                "Mapped filter 'date_filed__lte' to 'cluster__date_filed__lte' for opinions endpoint."
            )

    return normalized


def request_json(url: str, token: str, timeout_s: int = 60) -> Dict:
    headers = dict(BASE_HEADERS)
    headers["Authorization"] = f"Token {token}"
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        body = ""
        try:
            if exc.fp is not None:
                body = exc.fp.read().decode("utf-8", errors="replace")
        except Exception:  # noqa: BLE001
            body = ""

        detail = f"HTTP {exc.code} {exc.reason}"
        if body:
            detail = f"{detail} | response: {body}"
        raise RuntimeError(detail) from exc


def read_state(state_file: pathlib.Path) -> Dict:
    if not state_file.exists():
        return {}
    try:
        return json.loads(state_file.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return {}


def write_state(state_file: pathlib.Path, payload: Dict) -> None:
    state_file.parent.mkdir(parents=True, exist_ok=True)
    state_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def fetch_paginated(
    start_url: str,
    token: str,
    max_records: int,
    sleep_seconds: float,
    retries: int,
    timeout_seconds: int,
    output_file: pathlib.Path,
    state_file: pathlib.Path,
    resume: bool,
) -> Tuple[int, Optional[int]]:
    state = read_state(state_file) if resume else {}

    output_file.parent.mkdir(parents=True, exist_ok=True)
    if resume and output_file.exists() and isinstance(state.get("next_url"), str):
        url = state["next_url"]
        fetched = int(state.get("fetched_records", 0))
        mode = "a"
        print(f"Resuming from saved cursor with {fetched} records already written.")
    else:
        url = start_url
        fetched = 0
        mode = "w"

    total_count: Optional[int] = None
    with output_file.open(mode, encoding="utf-8") as out:
        while url and fetched < max_records:
            for attempt in range(retries + 1):
                try:
                    payload = request_json(url, token, timeout_s=timeout_seconds)
                    break
                except (socket.timeout, TimeoutError, urllib.error.URLError, RuntimeError) as exc:
                    if attempt >= retries:
                        raise RuntimeError(f"Request failed for {url}: {exc}") from exc
                    backoff = min(30.0, (2 ** attempt) + 1.0)
                    print(
                        f"Retrying ({attempt + 1}/{retries}) after error: {exc}. "
                        f"Sleeping {backoff:.1f}s..."
                    )
                    time.sleep(backoff)
            else:
                raise RuntimeError("Unreachable retry branch")

            if total_count is None:
                total_count = payload.get("count") if isinstance(payload, dict) else None

            batch = payload.get("results") if isinstance(payload, dict) else None
            if not isinstance(batch, list):
                raise RuntimeError(
                    "Unexpected API response shape. Expected DRF pagination with 'results'."
                )

            if not batch:
                break

            remaining = max_records - fetched
            write_batch = batch[:remaining]
            for row in write_batch:
                out.write(json.dumps(row, ensure_ascii=False) + "\n")

            fetched += len(write_batch)
            out.flush()

            next_url = payload.get("next") if isinstance(payload, dict) else None
            url = next_url if isinstance(next_url, str) and next_url else ""

            write_state(
                state_file,
                {
                    "next_url": url,
                    "fetched_records": fetched,
                    "api_reported_count": total_count,
                    "updated_at_utc": datetime.now(timezone.utc).isoformat(),
                },
            )

            if sleep_seconds > 0 and url:
                time.sleep(sleep_seconds)

    if not url and state_file.exists():
        state_file.unlink()

    return fetched, total_count


def write_manifest(
    manifest_file: pathlib.Path,
    endpoint: str,
    params: Dict[str, str],
    page_size: int,
    max_records: int,
    fetched: int,
    api_count: Optional[int],
) -> None:
    manifest = {
        "fetched_at_utc": datetime.now(timezone.utc).isoformat(),
        "endpoint": endpoint,
        "params": params,
        "page_size": page_size,
        "max_records": max_records,
        "fetched_records": fetched,
        "api_reported_count": api_count,
    }
    manifest_file.parent.mkdir(parents=True, exist_ok=True)
    manifest_file.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch CourtListener records into JSONL.")
    parser.add_argument(
        "--endpoint",
        default="https://www.courtlistener.com/api/rest/v4/opinions/",
        help="CourtListener endpoint URL.",
    )
    parser.add_argument(
        "--param",
        action="append",
        default=[],
        help="Query parameter in key=value format. Can be repeated.",
    )
    parser.add_argument(
        "--page-size",
        type=int,
        default=100,
        help="Requested page size for paginated endpoint.",
    )
    parser.add_argument(
        "--max-records",
        type=int,
        default=10000,
        help="Hard cap on number of records to fetch.",
    )
    parser.add_argument(
        "--sleep-seconds",
        type=float,
        default=0.2,
        help="Sleep between requests to reduce throttling pressure.",
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=3,
        help="Retries per request before failing.",
    )
    parser.add_argument(
        "--timeout-seconds",
        type=int,
        default=180,
        help="Per-request timeout in seconds.",
    )
    parser.add_argument(
        "--output-jsonl",
        default="data/courtlistener/raw/opinions.jsonl",
        help="Where to write fetched records as JSONL.",
    )
    parser.add_argument(
        "--output-manifest",
        default="data/courtlistener/raw/opinions.manifest.json",
        help="Where to write fetch metadata.",
    )
    parser.add_argument(
        "--state-file",
        default="data/courtlistener/raw/opinions.fetch.state.json",
        help="Resume/checkpoint state path for long-running downloads.",
    )
    parser.add_argument(
        "--no-resume",
        action="store_true",
        help="Ignore any previous state and start a fresh fetch.",
    )

    args = parser.parse_args()

    token = os.getenv("COURTLISTENER_API_TOKEN", "").strip()
    if not token:
        print("Missing COURTLISTENER_API_TOKEN environment variable.", file=sys.stderr)
        return 2

    if args.max_records <= 0:
        print("--max-records must be > 0", file=sys.stderr)
        return 2

    if args.page_size <= 0:
        print("--page-size must be > 0", file=sys.stderr)
        return 2

    params = normalize_params_for_endpoint(args.endpoint, parse_key_value(args.param))
    start_url = build_start_url(args.endpoint, params, args.page_size)

    output_jsonl = pathlib.Path(args.output_jsonl)
    output_manifest = pathlib.Path(args.output_manifest)
    state_file = pathlib.Path(args.state_file)

    fetched, api_count = fetch_paginated(
        start_url=start_url,
        token=token,
        max_records=args.max_records,
        sleep_seconds=max(0.0, args.sleep_seconds),
        retries=max(0, args.retries),
        timeout_seconds=max(10, args.timeout_seconds),
        output_file=output_jsonl,
        state_file=state_file,
        resume=not args.no_resume,
    )

    write_manifest(
        manifest_file=output_manifest,
        endpoint=args.endpoint,
        params=params,
        page_size=args.page_size,
        max_records=args.max_records,
        fetched=fetched,
        api_count=api_count,
    )

    print(f"Fetched {fetched} records -> {output_jsonl}")
    print(f"Manifest saved -> {output_manifest}")
    if state_file.exists():
        print(f"Checkpoint state saved -> {state_file}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
