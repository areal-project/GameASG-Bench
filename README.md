# GameASG-Bench

**Benchmarking Autonomous Software Generation for Game Development**

GameASG-Bench evaluates whether coding agents can turn natural-language requirements into complete, executable browser games. Each task asks an agent to deliver a single `index.html` that integrates gameplay, controls, rendering, state transitions, and a public behavioral testing interface.

The benchmark makes testability part of the specification: agents receive the gameplay requirements and the public interface before generation. Evaluation then combines static checks with browser-based tests of actions, outcomes, and state invariants.

- **47 game-generation tasks** across **12 primary genres**, including 32 2D and 15 3D games.
- **Two evaluation layers:** L1 checks artifact structure and source-level requirements; L2 tests behavior in headless Chromium.
- **Two coding-agent harnesses:** Claude Code and Codex CLI.

## Benchmark Design

### Task specification

Each game has three documents in [`task/`](task/):

| File | Purpose |
|---|---|
| `target.md` | The direct agent prompt, including the delivery request and workspace instructions. |
| `game-spec.md` | Player-visible gameplay, controls, progression, feedback, and completion conditions. |
| `tdd.md` | The public testing interface, legal scenarios, actions, snapshots, and invariants. |

The agent receives `target.md` as its initial prompt and reads the other two documents from its workspace. All first-party HTML, CSS, and JavaScript must be contained in `index.html`; third-party libraries may be loaded from stable CDN URLs as allowed by the task. Evaluation serves only the submitted HTML, so local companion assets are unavailable.

The public interface is `window.__gameTest`:

| Method | Role |
|---|---|
| `reset` | Restore the documented initial state. |
| `loadScenario` | Establish a legal gameplay precondition without completing the action under test. |
| `input` | Perform a documented player-level action. |
| `getSnapshot` | Return a stable, JSON-serializable view of the game state. |

This interface must control and observe the same state used by visible gameplay. L2 checks combine semantic observations with real browser input and independent signals such as rendering activity, resource changes, and runtime exceptions.

We categorize games using the [IGDB genre taxonomy](https://www.igdb.com/genres). IGDB is used by [industry platforms such as Twitch](https://blog.twitch.tv/en/2021/10/27/twitch-game-cover-art-to-be-powered-by-igdb/) and [academic datasets such as PlayMyData](https://arxiv.org/abs/2401.08561). See the [category definitions](category/category_definition.md) for the classification criteria and the [game catalog](category/results.md) for per-game assignments and descriptions.

### Evaluation

```text
Task documents
      |
      v
Coding agent in a fresh generation container
      |
      v
index.html — generation container exits and is removed
      |
      v
Separate evaluation container
      |-- L1: static artifact and contract checks
      `-- L2: browser interactions and behavioral checks
      |
      v
Per-game results and experiment report
```

Each game has an L1 definition in `tests/<game>/checks.json` and an L2 suite in `tests/<game>/checks.js`. Check priority is independent of evaluation layer:

| Priority | Scope |
|---|---|
| P0 | Launch, public-contract, and minimum-runtime prerequisites. |
| P1 | Required gameplay mechanics, interactions, and state invariants. |
| P2 | Extended mechanics and experience completeness. |

The generation container receives the task documents without the benchmark tests, evaluation runners, or previous reports. Once generation ends, the host transfers the HTML and generation records. The evaluation container receives the HTML and tests as read-only inputs and writes reports separately.

## Quick Start

### 1. Build the environment

Requirements: a running Docker daemon, Bash, Python 3.10+ on the host, and a provider API key for generation. Test-only runs do not require a model API key.

Run commands from the repository root:

```bash
docker build --platform linux/amd64 -t gamebench-env:v2.0 .
```

The image includes Python, Node.js, Chromium, Claude Code **2.1.206**, and Codex CLI **0.153.4**.

### 2. Generate and evaluate one game

Choose a harness and replace the API key and model placeholders with values for your provider.

**Codex CLI**

```bash
export OPENAI_API_KEY="<your-api-key>"

./docker_run.sh armor-alley \
  --harness codex \
  --model "<model-id>" \
  --exp-id codex-run
```

**Claude Code**

```bash
export ANTHROPIC_API_KEY="<your-api-key>"

./docker_run.sh armor-alley \
  --harness claude \
  --model "<model-id>" \
  --exp-id claude-run
```

Each command generates the game, runs L1 and L2, and writes results to `output/<exp-id>/armor-alley/`. By default, generation has **one attempt** with a **3,600-second wall-clock limit**. If a complete HTML already exists at that location, the command evaluates it again. Use a new experiment ID for an independent generation run.

### 3. Run a batch

With the corresponding API key exported:

```bash
./docker_batch.sh \
  --harness codex \
  --model "<model-id>" \
  --exp-id codex-batch \
  --jobs 2
```

This runs all valid task/test pairs and generates `output/codex-batch/report.md`. Add `--only armor-alley,kick-skills` to select a subset, or `--from 10 --to 20` to select an inclusive range from the sorted task list. Game directories containing both `index.html` and `summary.json` are skipped by default; `--no-skip` deletes selected existing game output directories before rerunning them.

## Configuration

Pass the harness and model explicitly for reproducible experiments. Common generation options are:

| Option | Meaning | Default |
|---|---|---|
| `--harness` | `claude` or `codex` | `claude` |
| `--model` | Model ID recognized by the endpoint | `ANTHROPIC_MODEL`, otherwise `claude-opus-4-8` |
| `--exp-id` | Experiment output directory name | Optional for single runs; timestamp for batches |
| `--base-url` | Provider endpoint override | Harness-specific endpoint |
| `--wall-cap` | Wall-clock limit per generation attempt, in seconds | `3600` |
| `--max-retries` | Total fresh generation attempts, including the first | `1` |
| `--retry-delay` | Delay between generation attempts, in seconds | `15` |
| `--max-turns` | Claude Code turn limit | `120` |
| `--dry-run` | Preview the run without launching containers | Off |

Additional attempts start from the original task documents in a clean workspace. They do not continue a previous session. Batch execution also accepts `--jobs` (default `1`) and `--cooldown` (default `10` seconds between launches). See `./docker_run.sh --help` and `./docker_batch.sh --help` for the full option lists.

### Provider endpoints

Claude Code uses `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` (default `https://api.anthropic.com`). Codex uses `OPENAI_API_KEY` and `OPENAI_BASE_URL` (default `https://api.openai.com/v1`). A compatible gateway can be selected with these variables or `--base-url`; the required protocols are Anthropic Messages for Claude Code and OpenAI Responses for Codex.

## Evaluate Existing Games

Place an existing submission at `output/<exp-id>/<game>/index.html`, then run:

```bash
# Evaluate a single game.
./docker_test.sh armor-alley --exp-id codex-run

# Evaluate every available game in an experiment.
./docker_test.sh --all --exp-id codex-batch

# Run only one evaluation layer.
./docker_test.sh --all --exp-id codex-batch --l1-only
./docker_test.sh --only armor-alley,kick-skills --exp-id codex-batch --l2-only
```

Without `--exp-id`, the input location is `output/<game>/index.html`. Retesting updates the selected layer's reports and summary fields. A single-layer run preserves the other layer's previous results.

## Results and Reporting

```text
output/<exp-id>/
├── <game>/
│   ├── index.html             # Generated game
│   ├── generation.json        # Attempt metadata and token usage
│   ├── generation-attempts/   # Agent traces and attempt records
│   ├── report-l1.json         # Itemized static-check results
│   ├── report-l2.json         # Itemized browser-test results
│   ├── summary.json           # Combined generation/evaluation summary
│   └── summary-test.json      # Evaluation execution summary
└── report.md                  # RQ1 task-performance and resource-use tables
```

Generation records are present for agent runs; test-only submissions need only `index.html`. Batch logs are stored under the experiment directory and in `logs/batch-docker-results.tsv`.

Generate or refresh a report after a single run or retest:

```bash
python3 scripts/gen_report.py --exp-dir output/codex-batch
```

The report contains a short experiment/coverage note. Each experiment directory must contain one model/harness configuration.

| Task performance columns | Resource-use columns |
|---|---|
| Model, Harness, Strict task success, L1, L2 Mean, L2 P0, L2 P1, L2 P2 | Model, Harness, File size (KB), Input tokens (k), Output tokens (k), Cost (USD) |

### Reading scores

- **Generation status `OK`** means generation produced an artifact eligible for evaluation.
- **Evaluation status `completed`** means evaluation executed successfully; individual checks may still fail.

## Repository Layout

```text
.
├── task/                        # Generation prompts, gameplay requirements, and contracts
├── tests/                       # Per-game L1 definitions and L2 suites
├── category/                    # Task catalog and classification metadata
├── config/codex/                # DeepSeek model catalog for Codex
├── scripts/
│   ├── l1/                      # Static evaluation runner
│   ├── l2/                      # HTTP server, Chromium runner, and observation hook
│   ├── generation_attempts.py   # Generation records and usage aggregation
│   └── gen_report.py            # Experiment reports
├── Dockerfile                   # Shared runtime image
├── docker_run.sh                # Single-game generation and evaluation
├── docker_batch.sh              # Batch scheduling and reporting
├── docker_entrypoint.sh         # Generation container entrypoint
├── docker_test.sh               # Evaluation orchestration for existing HTML
└── docker_test_entrypoint.sh    # Evaluation container entrypoint
```

## License

GameASG-Bench is licensed under the [Apache License 2.0](LICENSE). Third-party materials remain subject to their respective licenses.
