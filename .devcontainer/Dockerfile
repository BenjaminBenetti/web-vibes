FROM denoland/deno:bin-2.3.5 AS deno
FROM mcr.microsoft.com/devcontainers/typescript-node:22
COPY --from=deno /deno /usr/local/bin/deno

# === Install tooling ===
USER node
RUN curl https://www.geldata.com/sh --proto "=https" -sSf1 >> /tmp/geldata-install.sh && \
  chmod 777 /tmp/geldata-install.sh && \
  /tmp/geldata-install.sh -y