FROM node:22-alpine
RUN apk add --no-cache tini
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src/ ./src/
RUN chown -R 1000:1000 /app
USER 1000
EXPOSE 8080
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/index.js"]
