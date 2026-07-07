# Stash — self-hosted image. Runs anywhere with a disk; on Alibaba Cloud ECS/SAS
# (Singapore) it is the eligibility deployment. Data (scrubbed photos, generated
# plates, shops, the append-only ledger) persists in the /data volume.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 STASH_DATA_DIR=/data
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 && mkdir -p /data && chown nextjs:nodejs /data
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=build --chown=nextjs:nodejs /app/next.config.mjs ./next.config.mjs
USER nextjs
EXPOSE 3000
VOLUME ["/data"]
CMD ["npm", "start", "--", "-H", "0.0.0.0"]
