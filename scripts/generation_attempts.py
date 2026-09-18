#!/usr/bin/env python3
"""Record and aggregate independent generation attempts.

Each attempt has its own trace and metadata.  Aggregation deliberately treats
attempts as independent sessions; there is no continuation stage.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


TOKEN_FIELDS = ("input", "cached_input", "cache_write", "output")


def _as_int(value: Any) -> int:
    try:
        return max(0, int(value or 0))
    except (TypeError, ValueError):
        return 0


def _as_float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def extract_trace_usage(
    trace_path: Path,
    harness: str,
) -> dict[str, Any]:
    """Extract the final cumulative usage event from one attempt trace."""
    usage = {field: 0 for field in TOKEN_FIELDS}
    reasoning_output = 0
    provider_cost_usd: float | None = None
    usage_available = False

    try:
        lines = trace_path.read_text(errors="replace").splitlines()
    except OSError:
        lines = []

    for line in lines:
        try:
            event = json.loads(line)
        except (TypeError, json.JSONDecodeError):
            continue

        if harness == "claude" and event.get("type") == "result":
            usage_available = True
            raw = event.get("usage") or {}
            usage = {
                "input": _as_int(raw.get("input_tokens")),
                "cached_input": _as_int(raw.get("cache_read_input_tokens")),
                "cache_write": _as_int(raw.get("cache_creation_input_tokens")),
                "output": _as_int(raw.get("output_tokens")),
            }
            reasoning_output = _as_int(raw.get("reasoning_output_tokens"))
            event_cost = _as_float(event.get("total_cost_usd"))
            if event_cost is not None:
                provider_cost_usd = event_cost

        elif harness == "codex" and event.get("type") == "turn.completed":
            usage_available = True
            raw = event.get("usage") or {}
            cached = _as_int(raw.get("cached_input_tokens"))
            cache_write = _as_int(raw.get("cache_write_input_tokens"))
            total_input = _as_int(raw.get("input_tokens"))
            usage = {
                "input": max(0, total_input - cached - cache_write),
                "cached_input": cached,
                "cache_write": cache_write,
                "output": _as_int(raw.get("output_tokens")),
            }
            reasoning_output = _as_int(raw.get("reasoning_output_tokens"))

    if reasoning_output:
        usage["reasoning_output"] = reasoning_output
    if provider_cost_usd is not None:
        usage["provider_cost_usd"] = provider_cost_usd
    usage["_usage_available"] = usage_available
    return usage


def record_attempt(
    output: Path,
    *,
    attempt: int,
    status: str,
    failure_reason: str | None,
    auth_mode: str | None,
    auth_fallback_used: bool,
    harness_exit_code: int,
    elapsed_seconds: int,
    artifact_exists: bool,
    artifact_complete: bool,
    artifact_size: int,
) -> None:
    metadata = {
        "attempt": attempt,
        "status": status,
        "failure_reason": failure_reason or None,
        "auth_mode": auth_mode or None,
        "auth_fallback_used": auth_fallback_used,
        "harness_exit_code": harness_exit_code,
        "elapsed_seconds": elapsed_seconds,
        "artifact": {
            "exists": artifact_exists,
            "complete": artifact_complete,
            "size": artifact_size,
        },
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n")


def _attempt_number(path: Path) -> int:
    try:
        return int(path.name.rsplit("-", 1)[1])
    except (IndexError, ValueError):
        return 10**9


def summarize_attempts(
    attempts_dir: Path,
    harness: str,
    max_attempts: int,
    published_dir: str = "generation-attempts",
) -> dict[str, Any]:
    totals: dict[str, int | float] = {field: 0 for field in TOKEN_FIELDS}
    details: list[dict[str, Any]] = []
    provider_cost_seen = False
    reasoning_seen = False
    attempts_with_usage = 0

    attempt_dirs = sorted(attempts_dir.glob("attempt-*"), key=_attempt_number)
    for attempt_dir in attempt_dirs:
        metadata_path = attempt_dir / "attempt.json"
        if not metadata_path.is_file():
            continue
        try:
            metadata = json.loads(metadata_path.read_text())
        except (OSError, json.JSONDecodeError):
            continue

        trace_path = attempt_dir / "trace.jsonl"
        attempt_usage = extract_trace_usage(trace_path, harness)
        usage_available = bool(attempt_usage.pop("_usage_available", False))
        if usage_available:
            attempts_with_usage += 1
        for field in TOKEN_FIELDS:
            totals[field] += _as_int(attempt_usage.get(field))
        if "reasoning_output" in attempt_usage:
            reasoning_seen = True
            totals["reasoning_output"] = _as_int(totals.get("reasoning_output")) + _as_int(
                attempt_usage.get("reasoning_output")
            )
        if "provider_cost_usd" in attempt_usage:
            provider_cost_seen = True
            totals["provider_cost_usd"] = float(totals.get("provider_cost_usd", 0.0)) + float(
                attempt_usage["provider_cost_usd"]
            )

        attempt_name = attempt_dir.name
        detail = dict(metadata)
        detail["usage_available"] = usage_available
        detail["token_usage"] = attempt_usage
        detail["trace_file"] = f"{published_dir}/{attempt_name}/trace.jsonl"
        fallback_trace = attempt_dir / "trace-api-key.jsonl"
        if metadata.get("auth_fallback_used") and fallback_trace.is_file():
            detail["auth_fallback_trace_file"] = (
                f"{published_dir}/{attempt_name}/trace-api-key.jsonl"
            )
        stderr_files = sorted(p.name for p in attempt_dir.glob("*-stderr.log"))
        if stderr_files:
            detail["stderr_file"] = f"{published_dir}/{attempt_name}/{stderr_files[0]}"
        final_message = attempt_dir / "final-message.txt"
        if final_message.is_file():
            detail["final_message_file"] = f"{published_dir}/{attempt_name}/final-message.txt"
        details.append(detail)

    if not reasoning_seen:
        totals.pop("reasoning_output", None)
    if not provider_cost_seen:
        totals.pop("provider_cost_usd", None)

    successful_attempt = next(
        (detail.get("attempt") for detail in details if detail.get("status") == "success"),
        None,
    )
    return {
        "policy": "fresh_retry",
        "continuation_enabled": False,
        "max_attempts": max_attempts,
        "attempts": len(details),
        "successful_attempt": successful_attempt,
        "usage_complete": bool(details) and attempts_with_usage == len(details),
        "attempts_with_usage": attempts_with_usage,
        "token_usage": totals,
        "attempt_details": details,
    }


def _parse_bool(value: str) -> bool:
    if value == "true":
        return True
    if value == "false":
        return False
    raise argparse.ArgumentTypeError("expected true or false")


def main() -> None:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)

    record_parser = subparsers.add_parser("record")
    record_parser.add_argument("--output", type=Path, required=True)
    record_parser.add_argument("--attempt", type=int, required=True)
    record_parser.add_argument("--status", choices=("success", "failed"), required=True)
    record_parser.add_argument("--failure-reason", default="")
    record_parser.add_argument("--auth-mode", default="")
    record_parser.add_argument("--auth-fallback-used", type=_parse_bool, default=False)
    record_parser.add_argument("--harness-exit-code", type=int, required=True)
    record_parser.add_argument("--elapsed-seconds", type=int, required=True)
    record_parser.add_argument("--artifact-exists", type=_parse_bool, required=True)
    record_parser.add_argument("--artifact-complete", type=_parse_bool, required=True)
    record_parser.add_argument("--artifact-size", type=int, required=True)

    summarize_parser = subparsers.add_parser("summarize")
    summarize_parser.add_argument("--attempts-dir", type=Path, required=True)
    summarize_parser.add_argument("--harness", choices=("claude", "codex"), required=True)
    summarize_parser.add_argument("--max-attempts", type=int, required=True)
    summarize_parser.add_argument("--published-dir", default="generation-attempts")
    summarize_parser.add_argument("--output", type=Path, required=True)

    args = parser.parse_args()
    if args.command == "record":
        record_attempt(
            args.output,
            attempt=args.attempt,
            status=args.status,
            failure_reason=args.failure_reason,
            auth_mode=args.auth_mode,
            auth_fallback_used=args.auth_fallback_used,
            harness_exit_code=args.harness_exit_code,
            elapsed_seconds=args.elapsed_seconds,
            artifact_exists=args.artifact_exists,
            artifact_complete=args.artifact_complete,
            artifact_size=args.artifact_size,
        )
        return

    summary = summarize_attempts(
        args.attempts_dir,
        args.harness,
        args.max_attempts,
        args.published_dir,
    )
    args.output.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
