# DeepSeek Model Catalog for Codex

`deepseek-models.json` is adapted from DeepSeek's official Codex model catalog and frozen for this benchmark. It is mounted only when running DeepSeek V4 through the Codex harness.

- Source: the official setup script linked in the [DeepSeek Codex integration guide](https://api-docs.deepseek.com/quick_start/agent_integrations/codex/).
- Setup script version: `1.2.0`.

Project adjustment: `minimal_client_version` is set to `0.153.4` for all three models, matching the Codex CLI version pinned by this project. All other model settings are unchanged.
