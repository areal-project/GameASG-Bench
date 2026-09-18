#!/usr/bin/env python3
"""Generate the two RQ1 tables: task performance and mean resource use."""

import argparse
import json
import math
import statistics
from pathlib import Path


BENCHMARK_ROOT = Path(__file__).resolve().parents[1]

COST_PER_MILLION = {
    # USD per 1M tokens, checked 2026-09-16. Fixed standard-context estimates;
    # no priority/batch, long-context, cache-storage, or tool-call adjustments.
    # https://developers.openai.com/api/docs/pricing (Standard, short context)
    "gpt-6-astra": {"input": 10.0, "cached_input": 1.0, "cache_write": 12.5, "output": 50.0},
    # Sol's promotional rates are available through at least 2026-11-21.
    "gpt-5.6-sol": {"input": 4.0, "cached_input": 0.4, "cache_write": 5.0, "output": 20.0},
    "gpt-5.5": {"input": 5.0, "cached_input": 0.5, "cache_write": 0, "output": 30.0},
    # https://platform.claude.com/docs/en/models/opus-5/overview (5-minute writes)
    "claude-opus-5": {"input": 5.0, "cached_input": 0.5, "cache_write": 6.25, "output": 25.0},
    "claude-opus-4-8": {"input": 5.0, "cached_input": 0.5, "cache_write": 6.25, "output": 25.0},
    # Original V4 tariffs from the historical official price table, retained
    # for the paper's models; these are NOT current V4.1 / peak-hour prices.
    # https://api-docs.deepseek.com/quick_start/pricing
    "deepseek-v4-flash": {"input": 0.14, "cached_input": 0.0028, "cache_write": 0, "output": 0.28},
    "deepseek-v4-pro": {"input": 0.435, "cached_input": 0.003625, "cache_write": 0, "output": 0.87},
    # https://platform.kimi.ai/ (K3 model card, flat rates across context lengths)
    "kimi-k3": {"input": 3.0, "cached_input": 0.3, "cache_write": 0, "output": 15.0},
    # https://docs.z.ai/guides/overview/pricing (cache storage temporarily free)
    "glm-5.2": {"input": 1.4, "cached_input": 0.26, "cache_write": 0, "output": 4.4},
    # https://www-sg.tencentcloud.com/document/product/1300/78937 (Hy3)
    "hunyuan-3": {"input": 0.132, "cached_input": 0.033, "cache_write": 0, "output": 0.528},
    # https://platform.minimax.io/docs/guides/pricing-paygo
    # Standard <=512K input, permanent 50% discount; automatic caching only.
    "minimax-m3": {"input": 0.3, "cached_input": 0.06, "cache_write": 0, "output": 1.2},
    # Models without a separate cache-write charge include cold input in input.
    # Existing harness defaults, used only when the model is not listed.
    "claude": {"input": 5.0, "cached_input": 0.5, "cache_write": 6.25, "output": 25.0},
    "codex": {"input": 5.0, "cached_input": 0.5, "cache_write": 0, "output": 30.0},
}


def load_benchmark_games():
    """The benchmark task inventory, independent of any experiment's outputs."""
    games = sorted(p.name for p in (BENCHMARK_ROOT / "task").iterdir() if p.is_dir())
    if not games:
        raise ValueError("Benchmark task inventory is empty")
    return games


def load_experiment(exp_dir):
    """Load one record per benchmark task, including tasks with no results yet."""
    if not Path(exp_dir).is_dir():
        raise ValueError(f"Experiment directory does not exist: {exp_dir}")
    results = []
    game_dirs = [Path(exp_dir) / game for game in load_benchmark_games()]
    for game_dir in sorted(game_dirs):
        summary_path = game_dir / "summary.json"
        summary_source = "summary.json"
        if not summary_path.exists():
            test_summary_path = game_dir / "summary-test.json"
            if test_summary_path.exists():
                summary_path = test_summary_path
                summary_source = "summary-test.json"
        if not summary_path.exists():
            results.append({
                "game": game_dir.name,
                "status": "MISSING_SUMMARY",
                "summary_missing": True,
            })
            continue

        try:
            with open(summary_path) as f:
                record = json.load(f)
            if not isinstance(record, dict):
                raise ValueError("Summary must be a JSON object")
        except (OSError, ValueError) as exc:
            results.append({
                "game": game_dir.name,
                "status": "BAD_SUMMARY",
                "summary_error": str(exc),
            })
            continue

        record["game"] = game_dir.name
        if summary_source == "summary-test.json" or "status" not in record:
            # Test-only artifacts contain the complete evaluation counts but
            # do not certify generation metadata. Keep them usable for the
            # evaluation sections without presenting them as full runs.
            record["status"] = "TEST_ONLY"
            record["summary_source"] = summary_source
            index_path = game_dir / "index.html"
            if index_path.exists():
                record.setdefault("file_size", index_path.stat().st_size)
        results.append(record)
    return results


def to_number(value):
    """Missing, non-finite, and negative measurements are not zero."""
    if value is None or isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (ValueError, TypeError):
        return None
    return number if math.isfinite(number) and number >= 0 else None


def check_counts(record, layer):
    counts = record.get(layer)
    if not isinstance(counts, dict):
        return None
    passed = to_number(counts.get("passed"))
    total = to_number(counts.get("total"))
    if passed is None or total is None or passed > total:
        return None
    if not passed.is_integer() or not total.is_integer():
        return None
    return int(passed), int(total)


def read_l2_checks(exp_dir, game):
    """Use itemized L2 outcomes for both per-game means and pooled priorities."""
    try:
        report = json.loads((Path(exp_dir) / game / "report-l2.json").read_text())
    except (OSError, ValueError):
        return None
    if not isinstance(report, dict) or report.get("error"):
        return None
    checks = report.get("checks")
    if not isinstance(checks, list) or not checks:
        return None
    if any(not isinstance(c, dict) or c.get("level") not in ("P0", "P1", "P2")
           or c.get("status") not in ("PASS", "FAIL", "NOT_APPLICABLE") for c in checks):
        return None
    return checks


def generation_usage_complete(record):
    generation = record.get("generation")
    return not (isinstance(generation, dict) and generation.get("usage_complete") is False)


def get_cost_rates(model, harness):
    model = (model or "").lower()
    if model == "hy3":  # Tencent's API ID for the paper's Hunyuan-3.
        model = "hunyuan-3"
    return COST_PER_MILLION.get(model) or COST_PER_MILLION.get(harness)


def calc_cost(record, harness):
    """Estimate per-game cost from the local per-million-token price table."""
    if not generation_usage_complete(record):
        return None
    rates = get_cost_rates(record.get("model", ""), harness)
    if not rates:
        return None
    cost = 0.0
    for field in ("input", "cached_input", "cache_write", "output"):
        tokens = to_number(record.get(field))
        if tokens is None:
            return None
        cost += tokens / 1_000_000 * rates[field]
    return cost


def mean_text(values, decimals):
    return f"{statistics.mean(values):,.{decimals}f}" if values else "—"


def percent(passed, total):
    return f"{100 * passed / total:.1f}" if total else "—"


def render_report(results, exp_dir):
    """Render one model/harness configuration; fail on accidentally mixed runs."""
    identity = {}
    for field in ("model", "harness"):
        values = {r[field] for r in results if r.get(field)}
        if len(values) > 1:
            raise ValueError(f"Experiment contains multiple {field} values; report each configuration separately")
        identity[field] = next(iter(values), "—")
    model, harness = identity["model"], identity["harness"]

    l1_rates, l2_rates = [], []
    priorities = {level: [0, 0] for level in ("P0", "P1", "P2")}
    resources = {key: [] for key in ("File size", "Input tokens", "Output tokens", "Cost")}
    strict_successes = evaluated = 0
    generated = sum(r.get("status") == "OK" for r in results)

    for record in results:
        status = record.get("status")
        # Artifact sizes cover delivered games, regardless of subsequent check failures.
        if status in ("OK", "TEST_ONLY"):
            size = to_number(record.get("file_size"))
            if size is not None:
                resources["File size"].append(size / 1024)

        if status != "TEST_ONLY" and generation_usage_complete(record):
            inputs = [to_number(record.get(k)) for k in ("input", "cached_input", "cache_write")]
            if all(v is not None for v in inputs):
                resources["Input tokens"].append(sum(inputs) / 1000)
            output = to_number(record.get("output"))
            if output is not None:
                resources["Output tokens"].append(output / 1000)
            cost = calc_cost(record, harness)
            if cost is not None:
                resources["Cost"].append(cost)

        if status not in ("OK", "TEST_ONLY") or record.get("evaluation_status") not in (None, "completed"):
            continue
        l1 = check_counts(record, "l1")
        l2 = check_counts(record, "l2")
        checks = read_l2_checks(exp_dir, record["game"])
        if l1 is None or l1[1] == 0 or l2 is None or checks is None:
            continue
        applicable = [c for c in checks if c["status"] != "NOT_APPLICABLE"]
        if not applicable:
            continue
        evaluated += 1
        l1_rates.append(100 * l1[0] / l1[1])
        l2_rates.append(100 * sum(c["status"] == "PASS" for c in applicable) / len(applicable))
        for level in priorities:
            selected = [c for c in applicable if c["level"] == level]
            priorities[level][0] += sum(c["status"] == "PASS" for c in selected)
            priorities[level][1] += len(selected)
        required = [c for c in applicable if c["level"] in ("P0", "P1")]
        required_levels = {c["level"] for c in required}
        if (status == "OK" and l1[0] == l1[1] and required_levels == {"P0", "P1"}
                and all(c["status"] == "PASS" for c in required)):
            strict_successes += 1

    total = len(results)
    notes = []
    strict = f"{strict_successes}/{total} ({percent(strict_successes, total)})"
    if any(r.get("status") == "TEST_ONLY" for r in results):
        notes.append("Test-only submissions contribute check pass rates but are not counted as strict successes: generation is unverified.")
    coverage = "; ".join(f"{key} {len(values)}/{total}" for key, values in resources.items())
    lines = [
        f"# RQ1 Results: {Path(exp_dir).name}", "",
        f"Benchmark tasks: {total}. Generated: {generated}/{total}; evaluated: {evaluated}/{total}.", "",
        "## Task Performance", "",
        "| Model | Harness | Strict task success | L1 | L2 Mean | L2 P0 | L2 P1 | L2 P2 |",
        "|---|---|---|---|---|---|---|---|",
        f"| {model} | {harness} | {strict} | {mean_text(l1_rates, 1)} | {mean_text(l2_rates, 1)} | "
        + " | ".join(percent(*priorities[level]) for level in priorities) + " |", "",
        "Check pass rates are percentages. L1 and L2 Mean average per-game rates; "
        "L2 P0/P1/P2 pool applicable checks. Strict success requires successful delivery and evaluation, "
        "all L1 checks and all applicable L2 P0/P1 checks passing; L2 P2 is excluded. "
        "Its denominator is the full benchmark task set, including failures and missing results.", "",
        "## Resource Use", "",
        "| Model | Harness | File size (KB) | Input tokens (k) | Output tokens (k) | Cost (USD) |",
        "|---|---|---|---|---|---|",
        f"| {model} | {harness} | {mean_text(resources['File size'], 2)} | "
        f"{mean_text(resources['Input tokens'], 1)} | {mean_text(resources['Output tokens'], 1)} | "
        f"{mean_text(resources['Cost'], 4)} |", "",
        f"Per-game means over available records: {coverage}. Missing values are excluded, not zero. "
        "Input tokens include input, cache reads and cache writes; k = 1,000 and KB = 1,024 bytes. "
        "Complete generation usage includes failed attempts/tasks.", "",
        "Cost is estimated from COST_PER_MILLION in scripts/gen_report.py, using model prices "
        "or harness defaults when the model is not listed. All prices and costs are in USD. "
        "Estimates use standard-context rates (Claude: 5-minute cache writes) and the original "
        "DeepSeek V4 tariffs; request-specific surcharges and tool fees are excluded.",
    ]
    if notes:
        lines += ["", *notes]
    return "\n".join(lines) + "\n"


def generate_single_report(exp_dir, output_path=None):
    results = load_experiment(exp_dir)
    report = render_report(results, exp_dir)
    destination = Path(output_path) if output_path else Path(exp_dir) / "report.md"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(report, encoding="utf-8")
    print(f"Report written to: {destination}")
    return report


def main():
    parser = argparse.ArgumentParser(description="Generate the two RQ1 result tables")
    parser.add_argument("--exp-dir", required=True, help="One model/harness experiment directory")
    parser.add_argument("--output", help="Markdown output path (default: <exp-dir>/report.md)")
    args = parser.parse_args()
    try:
        generate_single_report(args.exp_dir, args.output)
    except (OSError, ValueError) as exc:
        parser.exit(2, f"Error: {exc}\n")


if __name__ == "__main__":
    main()
