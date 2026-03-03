FROM node:22-alpine
RUN apk add --no-cache tini
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src/ ./src/
RUN chown -R 1000:1000 /app
USER 1000

ARG VARIANT_STYLE=funny
ARG VARIANT_MODEL=claude-sonnet-4-20250514
ARG ROUND=1
ENV VARIANT_STYLE=${VARIANT_STYLE}
ENV VARIANT_MODEL=${VARIANT_MODEL}
ENV ROUND=${ROUND}

EXPOSE 8080
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/index.js"]
