FROM mcr.microsoft.com/devcontainers/typescript-node:0-18-bullseye

# Default ZSH configuration only load the git plugin. This adds yarn as well.
RUN su node -c "sed -i 's/plugins=(git)/plugins=(git yarn)/' ~/.zshrc"

ENV DENO_VERSION=v1.33.3
ENV DENO_INSTALL=/deno

RUN mkdir -p /deno \
  && curl -fsSL https://deno.land/x/install/install.sh -o install-deno.sh \
  && sh install-deno.sh ${DENO_VERSION} \
  && chown -R node /deno \
  && chmod -R 777 /deno \
  && rm install-deno.sh

ENV PATH=${DENO_INSTALL}/bin:${PATH} \
  DENO_DIR=${DENO_INSTALL}/.cache/deno

# Persist ZSH history
RUN mkdir /command_history \
  && touch /command_history/.zsh_history \
  && chown -R node /command_history

# Touch node_modules mounted as volumes
RUN mkdir -p /workspace/node_modules \
  && mkdir -p /workspace/packages/docs/node_modules \
  && chown -R node /workspace
