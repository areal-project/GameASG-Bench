#!/usr/bin/env python3
"""
L1 Static Check — 通用执行器。
支持 checks / anti_patterns / proximity_checks 三个数组。

Usage:
    python3 run_l1.py <html-path> --checks <checks.json>
    python3 run_l1.py <html-path> --checks <checks.json> -o report.json
    python3 run_l1.py <html-path> --checks <checks.json> --json
"""

import argparse
import json
import re
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from html.parser import HTMLParser
from urllib.parse import unquote, urlparse
from pathlib import Path


VALID_LEVELS = frozenset({"P0", "P1", "P2"})
CHECK_SECTIONS = ("tool_checks", "checks", "anti_patterns", "proximity_checks")
SUPPORTED_CHECK_TYPES = frozenset({
    "min_size_kb",
    "tool_check",
    "regex_any",
    "regex_all",
    "regex_none",
    "regex_proximity",
})
SUPPORTED_TOOLS = frozenset({
    "html_structure",
    "node_syntax",
    "eslint_undef",
    "script_not_empty",
    "file_exists",
})


class ConfigValidationError(ValueError):
    """Raised when a checks.json cannot be safely executed."""


def check_regex_any(text: str, patterns: list) -> tuple[bool, list]:
    matches = []
    for p in patterns:
        try:
            if re.search(p, text):
                matches.append(p)
        except re.error:
            pass
    return (len(matches) > 0, matches)


def check_regex_all(text: str, patterns: list) -> tuple[bool, list, list]:
    matches = []
    missing = []
    for p in patterns:
        try:
            if re.search(p, text):
                matches.append(p)
            else:
                missing.append(p)
        except re.error:
            missing.append(p)
    return (len(missing) == 0, matches, missing)


def check_regex_none(text: str, patterns: list, exclude_in: list = None) -> tuple[bool, list]:
    bad = []
    for p in patterns:
        try:
            for m in re.finditer(p, text):
                start = max(0, m.start() - 200)
                end = min(len(text), m.end() + 200)
                snippet = text[start:end]
                if exclude_in and any(ex in snippet for ex in exclude_in):
                    continue
                bad.append(p)
                break
        except re.error:
            pass
    return (len(bad) == 0, bad)


def check_regex_proximity(text: str, patterns: list, min_count: int = 1) -> tuple[bool, list]:
    matches = []
    for p in patterns:
        try:
            cnt = len(re.findall(p, text, re.DOTALL))
            if cnt >= min_count:
                matches.append(f"{p[:60]}... (x{cnt})")
        except re.error:
            pass
    return (len(matches) > 0, matches)


def check_min_size_kb(file_size: int, threshold: int) -> tuple[bool, str]:
    kb = file_size / 1024
    return (kb >= threshold, f"{kb:.1f} KB")


@dataclass
class ScriptAsset:
    label: str
    content: str
    is_module: bool = False


class TagCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = set()
        self.scripts: list[ScriptAsset] = []
        self.script_srcs = []
        self._in_script = False
        self._script_buf = []
        self._script_type = ""

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        if tag.lower() == "script":
            attr_map = {str(k).lower(): v for k, v in attrs}
            src = attr_map.get("src")
            script_type = (attr_map.get("type") or "").strip().lower()
            if src:
                self.script_srcs.append((src, script_type))
            else:
                self._in_script = True
                self._script_buf = []
                self._script_type = script_type

    def handle_endtag(self, tag):
        if tag.lower() == "script" and self._in_script:
            self._in_script = False
            label = f"inline script #{len(self.scripts) + 1}"
            self.scripts.append(ScriptAsset(label, "".join(self._script_buf), self._script_type == "module"))
            self._script_type = ""

    def handle_data(self, data):
        if self._in_script:
            self._script_buf.append(data)


def extract_scripts(html_text: str, html_path: Path | None = None) -> tuple[set, list[ScriptAsset], str]:
    collector = TagCollector()
    collector.feed(html_text)
    scripts = list(collector.scripts)
    linked_text = []
    if html_path is not None:
        html_root = html_path.parent.resolve()
        for src, script_type in collector.script_srcs:
            parsed = urlparse(src)
            if parsed.scheme or parsed.netloc or src.startswith("//"):
                continue
            rel = unquote(parsed.path)
            if not rel:
                continue
            candidate = (html_path.parent / rel).resolve()
            try:
                candidate.relative_to(html_root)
            except ValueError:
                continue
            if candidate.exists() and candidate.is_file():
                txt = candidate.read_text(encoding="utf-8", errors="replace")
                scripts.append(ScriptAsset(f"linked script {src}", txt, script_type == "module"))
                linked_text.append(f"\n/* linked script: {src} */\n{txt}")
    return collector.tags, scripts, "".join(linked_text)


def script_contents(scripts: list[ScriptAsset]) -> list[str]:
    return [s.content for s in scripts]


def tool_check_node_syntax(scripts: list[ScriptAsset]) -> tuple[bool, str]:
    if not scripts:
        return (False, "no local or inline <script> found")
    checked = 0
    for script in scripts:
        suffix = ".mjs" if script.is_module else ".js"
        with tempfile.NamedTemporaryFile(suffix=suffix, mode="w", delete=False, encoding="utf-8") as f:
            f.write(script.content)
            tmp_path = f.name
        try:
            r = subprocess.run(["node", "--check", tmp_path], capture_output=True, text=True, timeout=10)
            checked += 1
            if r.returncode != 0:
                err = (r.stderr or "").strip().split("\n")
                msg = err[0][:200] if err else "syntax error"
                return (False, f"{script.label}: {msg}")
        except FileNotFoundError:
            return (True, "node not found, skipped")
        except subprocess.TimeoutExpired:
            return (False, f"{script.label}: node --check timed out")
        finally:
            Path(tmp_path).unlink(missing_ok=True)
    return (True, f"syntax OK ({checked} script{'s' if checked != 1 else ''})")


def tool_check_eslint_undef(scripts: list[ScriptAsset]) -> tuple[bool, str]:
    """Run acorn-based undef_check.js to detect references to undefined functions/variables."""
    if not scripts:
        return (False, "no local or inline <script> found")
    combined = "\n;\n".join(script_contents(scripts))
    with tempfile.NamedTemporaryFile(suffix=".js", mode="w", delete=False, encoding="utf-8") as f:
        f.write(combined)
        tmp_path = f.name

    undef_script = Path(__file__).parent / "undef_check.js"

    try:
        r = subprocess.run(
            ["node", str(undef_script), tmp_path, "--json"],
            capture_output=True, text=True, timeout=30
        )
        result = json.loads(r.stdout) if r.stdout.strip() else {}

        if r.returncode == 2:
            return (False, result.get("error", "parse error"))

        if result.get("pass", False):
            return (True, "no undefined references")

        count = result.get("count", 0)
        undef_list = result.get("undef", [])
        details = "; ".join(f"'{u['name']}' line {u['line']}" for u in undef_list[:5])
        summary = f"{count} undefined ref(s): {details}"
        if count > 5:
            summary += f" ... +{count - 5} more"
        return (False, summary)
    except FileNotFoundError:
        return (True, "node not found, skipped")
    except subprocess.TimeoutExpired:
        return (False, "undef_check timed out (30s)")
    except (json.JSONDecodeError, KeyError):
        return (False, f"undef_check output error: {(r.stdout or r.stderr)[:200]}")
    finally:
        Path(tmp_path).unlink(missing_ok=True)


def tool_check_html_structure(tags: set, required: list[str]) -> tuple[bool, str]:
    missing = [t for t in required if t.lower() not in tags]
    if missing:
        return (False, f"missing tags: {', '.join(missing)}")
    return (True, f"all required tags present: {', '.join(required)}")


def tool_check_script_not_empty(scripts: list[ScriptAsset], min_length: int = 100) -> tuple[bool, str]:
    if not scripts:
        return (False, "no local or inline <script> found")
    longest_script = max(scripts, key=lambda s: len(s.content.strip()))
    longest = len(longest_script.content.strip())
    if longest < min_length:
        return (False, f"longest script is {longest} chars, need ≥{min_length}")
    return (True, f"longest script: {longest} chars ({longest_script.label})")


def normalize_check(check: dict, section: str, index: int) -> dict:
    """Accept older checks.json spellings while preserving check intent."""
    c = dict(check)
    c.setdefault("id", f"{section}-{index + 1}")
    c.setdefault("level", c.get("priority", "P1"))
    c.setdefault("name", c.get("description", c["id"]))

    typ = c.get("type", "")
    tool = c.get("tool", "")

    if section == "tool_checks":
        if typ == "min_size_kb":
            return c
        if typ in {"html_has_script", "html_parse"} or tool in {"html_structure", "html_has_script", "html_parse"}:
            c["type"] = "tool_check"
            c["tool"] = "html_structure"
            c.setdefault("required_tags", ["html", "script"])
            return c
        if typ in {"javascript_syntax", "js_syntax", "syntax"} or tool in {"node_syntax", "javascript_syntax", "js_syntax"}:
            c["type"] = "tool_check"
            c["tool"] = "node_syntax"
            return c
        if typ in {"script_not_empty"} or tool == "script_not_empty":
            c["type"] = "tool_check"
            c["tool"] = "script_not_empty"
            return c
        if typ in {"file_exists", "required_file"}:
            c["type"] = "tool_check"
            c["tool"] = "file_exists"
            return c
        if typ in {"regex", "static", "static_signal", "regex_any", "static_any", "regex_all", "static_all"}:
            if typ in {"regex_any", "static_any"}:
                c["type"] = "regex_any"
            else:
                c["type"] = "regex_all"
            return c

    if section == "anti_patterns":
        if typ in {"anti_regex", "anti_pattern", "regex_absent", "regex_forbid", "regex", "regex_none"}:
            c["type"] = "regex_none"
            return c

    if section == "proximity_checks":
        if typ in {"proximity", "regex_near", "regex", "regex_proximity"}:
            c["type"] = "regex_proximity"
            return c

    if typ in {"regex", "static", "static_signal", "static_mixed"}:
        c["type"] = "regex_all"
    elif typ == "static_any":
        c["type"] = "regex_any"
    elif typ == "static_all":
        c["type"] = "regex_all"

    return c


def normalize_tool_checks(value) -> list[dict]:
    if isinstance(value, list):
        return [c for c in value if isinstance(c, dict)]
    if isinstance(value, dict):
        checks = []
        if value.get("requires_single_html_entry") or value.get("requires_html_entry"):
            checks.append({
                "id": "tool-html-entry",
                "level": "P0",
                "name": "HTML game entry is present",
                "type": "file_exists",
                "paths": ["index.html"],
                "fix_hint": "Provide the required index.html game entry.",
            })
        if value.get("requires_no_fatal_js") or value.get("requires_js_syntax"):
            checks.append({
                "id": "tool-js-syntax",
                "level": "P0",
                "name": "JavaScript syntax is valid",
                "type": "javascript_syntax",
                "fix_hint": "Fix JavaScript syntax errors so the game can load.",
            })
        return checks
    return []


def validate_config(cfg: dict) -> dict[str, list[dict]]:
    """Normalize supported legacy spellings and validate the executable config.

    A check's ``level`` is configuration metadata and must be one of P0/P1/P2.
    ``status`` is deliberately treated as a report-only field: the runner adds
    it after executing a check, so accepting it in checks.json would make it
    easy to confuse a configured priority with an execution result.
    """
    if not isinstance(cfg, dict):
        raise ConfigValidationError("top level must be a JSON object")

    errors = []
    normalized: dict[str, list[dict]] = {}
    seen_ids = {}

    for section in CHECK_SECTIONS:
        raw = cfg.get(section, [])
        if section == "tool_checks" and isinstance(raw, dict):
            # Preserve the legacy boolean tool-check schema supported by the
            # runner. normalize_tool_checks expands it into executable checks.
            candidates = normalize_tool_checks(raw)
        elif isinstance(raw, list):
            candidates = raw
        else:
            errors.append(f"{section} must be an array")
            candidates = []

        normalized[section] = []
        for index, raw_check in enumerate(candidates):
            location = f"{section}[{index}]"
            if not isinstance(raw_check, dict):
                errors.append(f"{location} must be an object")
                continue

            check = normalize_check(raw_check, section, index)
            normalized[section].append(check)

            check_id = check.get("id")
            if not isinstance(check_id, str) or not check_id.strip():
                errors.append(f"{location}.id must be a non-empty string")
            elif check_id in seen_ids:
                errors.append(
                    f"{location}.id duplicates {seen_ids[check_id]} ({check_id!r})"
                )
            else:
                seen_ids[check_id] = location

            name = check.get("name")
            if not isinstance(name, str) or not name.strip():
                errors.append(f"{location}.name must be a non-empty string")

            level = check.get("level")
            if level not in VALID_LEVELS:
                errors.append(
                    f"{location}.level must be one of P0, P1, P2; got {level!r}"
                )

            if "status" in raw_check:
                errors.append(
                    f"{location}.status is runtime output; remove it from checks.json"
                )

            fix_hint = check.get("fix_hint")
            if not isinstance(fix_hint, str) or not fix_hint.strip():
                errors.append(f"{location}.fix_hint must be a non-empty string")

            check_type = check.get("type")
            if check_type not in SUPPORTED_CHECK_TYPES:
                errors.append(f"{location}.type is unsupported: {check_type!r}")
                continue

            if check_type == "tool_check":
                tool = check.get("tool")
                if section != "tool_checks":
                    errors.append(f"{location}.tool_check is only valid in tool_checks")
                if tool not in SUPPORTED_TOOLS:
                    errors.append(f"{location}.tool is unsupported: {tool!r}")

            if check_type in {"regex_any", "regex_all", "regex_none", "regex_proximity"}:
                patterns = check.get("patterns")
                if not isinstance(patterns, list) or not patterns:
                    errors.append(f"{location}.patterns must be a non-empty array")
                else:
                    for pattern_index, pattern in enumerate(patterns):
                        pattern_location = f"{location}.patterns[{pattern_index}]"
                        if not isinstance(pattern, str) or not pattern:
                            errors.append(f"{pattern_location} must be a non-empty string")
                            continue
                        try:
                            re.compile(pattern)
                        except re.error as exc:
                            errors.append(f"{pattern_location} is invalid: {exc}")

            if check_type == "min_size_kb":
                value = check.get("value")
                if isinstance(value, bool) or not isinstance(value, (int, float)) or value <= 0:
                    errors.append(f"{location}.value must be a positive number")

    if errors:
        details = "\n".join(f"- {error}" for error in errors)
        raise ConfigValidationError(f"invalid checks config:\n{details}")

    return normalized


def run_tool_check(check: dict, text: str, file_size: int, tags: set, scripts: list[ScriptAsset], html_path: Path) -> dict:
    result = {"id": check["id"], "level": check["level"], "name": check["name"]}
    tool = check.get("tool", "")
    typ = check.get("type", "")

    if typ == "min_size_kb":
        ok, info = check_min_size_kb(file_size, check["value"])
        result["status"] = "PASS" if ok else "FAIL"
        result["info"] = info
    elif tool == "node_syntax":
        ok, info = tool_check_node_syntax(scripts)
        result["status"] = "PASS" if ok else "FAIL"
        result["info"] = info
    elif tool == "eslint_undef":
        ok, info = tool_check_eslint_undef(scripts)
        result["status"] = "PASS" if ok else "FAIL"
        result["info"] = info
    elif tool == "html_structure":
        ok, info = tool_check_html_structure(tags, check.get("required_tags", []))
        result["status"] = "PASS" if ok else "FAIL"
        result["info"] = info
    elif tool == "script_not_empty":
        ok, info = tool_check_script_not_empty(scripts, check.get("min_length", 100))
        result["status"] = "PASS" if ok else "FAIL"
        result["info"] = info
    elif tool == "file_exists":
        paths = check.get("paths") or ["index.html"]
        missing = []
        for raw in paths:
            p = Path(raw)
            candidate = p if p.is_absolute() else html_path.parent / p
            if not candidate.exists():
                missing.append(str(raw))
        result["status"] = "PASS" if not missing else "FAIL"
        result["info"] = "all files present" if not missing else f"missing files: {', '.join(missing)}"
    elif typ in {"regex_any", "regex_all", "regex_none", "regex_proximity"}:
        return run_check(check, text, file_size)
    else:
        result["status"] = "ERROR"
        result["error"] = f"unknown tool: {tool}"

    if result["status"] != "PASS":
        result["fix_hint"] = check.get("fix_hint", "")
    return result


def run_check(check: dict, text: str, file_size: int) -> dict:
    typ = check.get("type")
    result = {"id": check["id"], "level": check["level"], "name": check["name"]}

    if typ == "regex_any":
        ok, matched = check_regex_any(text, check["patterns"])
        result["status"] = "PASS" if ok else "FAIL"
        result["matched"] = matched
    elif typ == "regex_all":
        ok, matched, missing = check_regex_all(text, check["patterns"])
        result["status"] = "PASS" if ok else "FAIL"
        result["matched"] = matched
        result["missing"] = missing
    elif typ == "regex_none":
        ok, bad = check_regex_none(text, check["patterns"], check.get("exclude_in"))
        result["status"] = "PASS" if ok else "FAIL"
        result["bad_matches"] = bad
    elif typ == "regex_proximity":
        ok, matched = check_regex_proximity(text, check["patterns"], check.get("min_count", 1))
        result["status"] = "PASS" if ok else "FAIL"
        result["matched"] = matched
    elif typ == "min_size_kb":
        ok, info = check_min_size_kb(file_size, check["value"])
        result["status"] = "PASS" if ok else "FAIL"
        result["info"] = info
    else:
        result["status"] = "ERROR"
        result["error"] = f"unknown type: {typ}"

    if result["status"] != "PASS":
        result["fix_hint"] = check.get("fix_hint", "")
    return result


def render_summary(report: dict, game_name: str) -> str:
    out = []
    out.append(f"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    out.append(f"{game_name} L1 STATIC CHECK")
    out.append(f"File: {report['file']} ({report['file_size_kb']:.1f} KB)")
    out.append(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    all_checks = report.get("checks", [])
    all_prox = report.get("proximity_checks", [])

    p0_checks = [c for c in all_checks if c.get("level") == "P0"]
    p1_checks = [c for c in all_checks if c.get("level") == "P1"]
    p1_checks += [c for c in all_prox if c.get("level") == "P1"]
    p2_checks = [c for c in all_checks if c.get("level") == "P2"]
    p2_checks += [c for c in all_prox if c.get("level") == "P2"]

    sections = [
        ("Tool Checks (P0)", report.get("tool_checks", [])),
        ("P0 — 结构合法性", p0_checks),
        ("Anti-Patterns", report["anti_patterns"]),
        ("P1 — 核心功能骨架", p1_checks),
        ("P2 — 扩展系统/关联性", p2_checks),
    ]

    total_pass = total_count = 0
    level_stats = {}
    for title, items in sections:
        if not items:
            continue
        out.append(f"\n━━━ {title} ━━━")
        sec_pass = sec_total = 0
        for c in items:
            ok = c["status"] == "PASS"
            total_pass += 1 if ok else 0
            total_count += 1
            sec_pass += 1 if ok else 0
            sec_total += 1
            icon = "✓" if ok else "✗"
            line = f"  {icon} {c['name']}"
            if not ok and c.get("fix_hint"):
                line += f"\n      ↳ {c['fix_hint'][:120]}"
            out.append(line)
        level_stats[title] = (sec_pass, sec_total)

    out.append(f"\n━━━ 总结 ━━━")
    for title, (sp, st) in level_stats.items():
        out.append(f"  {title}: {sp}/{st}")
    out.append(f"  Overall: {total_pass}/{total_count}")

    exit_code = 0 if report["pass"] else 1
    out.append(f"\n  EXIT: {exit_code} {'(L1 PASS)' if exit_code == 0 else '(L1 FAIL)'}")
    out.append(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    return "\n".join(out)


def main() -> int:
    parser = argparse.ArgumentParser(description="L1 Static Check")
    parser.add_argument("html", help="Path to index.html entry")
    parser.add_argument("--checks", required=True, help="Path to checks.json")
    parser.add_argument("-o", "--output", help="Write JSON report")
    parser.add_argument("--json", action="store_true", help="JSON to stdout")
    args = parser.parse_args()

    html_path = Path(args.html).resolve()
    if not html_path.exists():
        print(f"ERROR: not found: {html_path}", file=sys.stderr)
        return 2

    checks_path = Path(args.checks).resolve()
    try:
        with checks_path.open(encoding="utf-8") as checks_file:
            cfg = json.load(checks_file)
        normalized_cfg = validate_config(cfg)
    except (OSError, json.JSONDecodeError, ConfigValidationError) as exc:
        error_report = {
            "error": "invalid_checks_config",
            "checks": str(checks_path),
            "message": str(exc),
            "pass": False,
        }
        if args.output:
            Path(args.output).write_text(
                json.dumps(error_report, indent=2, ensure_ascii=False), encoding="utf-8"
            )
        if args.json:
            print(json.dumps(error_report, indent=2, ensure_ascii=False))
        else:
            print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    text = html_path.read_text(encoding="utf-8", errors="replace")
    file_size = html_path.stat().st_size
    game_name = cfg.get("_doc", "Game")

    # Extract HTML tags and local scripts for tool/static checks.
    tags, scripts, linked_script_text = extract_scripts(text, html_path)
    searchable_text = text + linked_script_text

    # Run tool checks first (syntax, structure, size)
    tool_cfg = normalized_cfg["tool_checks"]
    checks_cfg = normalized_cfg["checks"]
    anti_cfg = normalized_cfg["anti_patterns"]
    prox_cfg = normalized_cfg["proximity_checks"]

    tool_results = [run_tool_check(c, searchable_text, file_size, tags, scripts, html_path)
                    for c in tool_cfg]
    tool_pass = sum(1 for c in tool_results if c["status"] == "PASS")
    tool_total = len(tool_results)

    check_results = [run_check(c, searchable_text, file_size) for c in checks_cfg]
    ap_results = [run_check(c, searchable_text, file_size) for c in anti_cfg]
    prox_results = [run_check(c, searchable_text, file_size) for c in prox_cfg]

    p0_pass = sum(1 for c in check_results if c["level"] == "P0" and c["status"] == "PASS")
    p0_total = sum(1 for c in check_results if c["level"] == "P0")
    p1_pass = sum(1 for c in check_results + prox_results if c.get("level") == "P1" and c["status"] == "PASS")
    p1_total = sum(1 for c in check_results + prox_results if c.get("level") == "P1")
    p2_pass = sum(1 for c in check_results + prox_results if c.get("level") == "P2" and c["status"] == "PASS")
    p2_total = sum(1 for c in check_results + prox_results if c.get("level") == "P2")
    ap_triggers = sum(1 for c in ap_results if c["status"] != "PASS")

    all_green = (tool_pass == tool_total) and (p0_pass == p0_total) and (ap_triggers == 0) and (p1_pass == p1_total) and (p2_pass == p2_total)

    report = {
        "file": str(html_path),
        "file_size_kb": file_size / 1024,
        "tool_checks": tool_results,
        "checks": check_results,
        "anti_patterns": ap_results,
        "proximity_checks": prox_results,
        "summary": {
            "tool_pass": tool_pass, "tool_total": tool_total,
            "p0_pass": p0_pass, "p0_total": p0_total,
            "p1_pass": p1_pass, "p1_total": p1_total,
            "p2_pass": p2_pass, "p2_total": p2_total,
            "anti_pattern_triggers": ap_triggers,
        },
        "pass": all_green,
    }

    if args.output:
        Path(args.output).write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        print(render_summary(report, game_name))

    return 0 if all_green else 1


if __name__ == "__main__":
    sys.exit(main())
