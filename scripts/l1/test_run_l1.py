import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).parent))
import run_l1


class ChecksConfigTests(unittest.TestCase):
    def test_repository_configs_validate(self):
        repo_root = Path(__file__).resolve().parents[2]
        configs = sorted((repo_root / "tests").glob("*/checks.json"))
        self.assertTrue(configs)
        for path in configs:
            with self.subTest(path=path):
                config = json.loads(path.read_text(encoding="utf-8"))
                run_l1.validate_config(config)

    def test_invalid_level_is_rejected_before_execution(self):
        config = {
            "anti_patterns": [{
                "id": "forbid-direct-result",
                "level": "FAIL",
                "name": "No direct result action",
                "type": "regex_none",
                "patterns": ["forceWin"],
            }]
        }
        with self.assertRaisesRegex(run_l1.ConfigValidationError, r"level.*P0, P1, P2"):
            run_l1.validate_config(config)

    def test_missing_fix_hint_is_rejected(self):
        config = {
            "checks": [{
                "id": "requires-hint",
                "level": "P1",
                "name": "A check without remediation guidance",
                "type": "regex_any",
                "patterns": ["requiredSignal"],
            }]
        }
        with self.assertRaisesRegex(run_l1.ConfigValidationError, r"fix_hint.*non-empty"):
            run_l1.validate_config(config)

    def test_status_is_generated_from_execution_result(self):
        config = {
            "anti_patterns": [{
                "id": "forbid-direct-result",
                "level": "P1",
                "name": "No direct result action",
                "type": "regex_none",
                "fix_hint": "Remove direct result shortcuts from the public action contract.",
                "patterns": ["forceWin"],
            }]
        }
        normalized = run_l1.validate_config(config)
        result = run_l1.run_check(normalized["anti_patterns"][0], "input('forceWin')", 0)
        self.assertEqual(result["level"], "P1")
        self.assertEqual(result["status"], "FAIL")

    def test_cli_returns_config_error_without_running_checks(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            html_path = temp / "index.html"
            config_path = temp / "checks.json"
            html_path.write_text(
                "<html><body><script>input('forceWin')</script></body></html>",
                encoding="utf-8",
            )
            config_path.write_text(json.dumps({
                "anti_patterns": [{
                    "id": "forbid-direct-result",
                    "level": "FAIL",
                    "name": "No direct result action",
                    "type": "regex_none",
                    "patterns": ["forceWin"],
                }]
            }), encoding="utf-8")

            with patch.object(sys, "argv", [
                "run_l1.py", str(html_path), "--checks", str(config_path), "--json"
            ]):
                with patch("builtins.print") as print_mock:
                    exit_code = run_l1.main()

            self.assertEqual(exit_code, 2)
            report = json.loads(print_mock.call_args.args[0])
            self.assertEqual(report["error"], "invalid_checks_config")


if __name__ == "__main__":
    unittest.main()
