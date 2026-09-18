FROM --platform=linux/amd64 python:3.12-slim

ARG CLAUDECODE_VERSION=2.1.206

ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# ---------------------------------------------------------------------------
# System packages: Node.js, Chromium, curl, bash
# ---------------------------------------------------------------------------
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates curl bash sudo \
        nodejs npm \
        chromium \
        libnss3-tools \
        perl && \
    useradd -m -s /bin/bash -U admin && \
    echo 'admin ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/90-admin && \
    chmod 0440 /etc/sudoers.d/90-admin && \
    rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# Claude Code CLI + Codex CLI (via npm, pinned versions)
# ---------------------------------------------------------------------------
ARG CODEX_VERSION=0.153.4
RUN npm install -g @anthropic-ai/claude-code@${CLAUDECODE_VERSION} @openai/codex@${CODEX_VERSION}

# ---------------------------------------------------------------------------
# Node.js WebSocket package (for L2 CDP client, Node 20 lacks native WebSocket)
# ---------------------------------------------------------------------------
RUN npm install -g ws

# ---------------------------------------------------------------------------
# Directories
# ---------------------------------------------------------------------------
RUN mkdir -p /envarena/workspace /envarena/tests /envarena/scripts

ENV GAMEAGENT_CHROMIUM_EXECUTABLE=/usr/bin/chromium \
    NODE_PATH=/usr/lib/node_modules

WORKDIR /envarena/workspace
