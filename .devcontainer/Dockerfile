FROM denoland/deno:bin-2.3.5 AS deno
FROM mcr.microsoft.com/devcontainers/typescript-node:22
COPY --from=deno /deno /usr/local/bin/deno

# === Install Chrome for CRX packaging ===
USER root
RUN apt-get update && \
  apt-get install -y wget gnupg && \
  wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list && \
  apt-get update && \
  apt-get install -y google-chrome-stable

# === Install Tooling For User ===
USER node

# == Make vscode user data folder ===
RUN mkdir -p ~/.vscode-server/data/User

# == Install claude code 
RUN npm install -g @anthropic-ai/claude-code