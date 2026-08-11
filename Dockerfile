# Node.js 빌드는 이제 여기서 안 함 — CI(GitHub Actions)가 `npm ci && npm run build`로
# 미리 .next/standalone(+.next/static, public)을 만들어두고, 이 Dockerfile은 그 결과물을
# 런타임 이미지에 담기만 함 (backend Dockerfile과 동일한 패턴).
#
# 이전엔 이 파일이 3단계 멀티스테이지로 CI가 이미 끝낸 npm install/build를 또 통째로
# 다시 하고 있었음 — CI 쪽 "여기서도 한 번 먼저 빌드함(실패를 Docker 로그에 안 파묻히게)"
# 이라는 의도랑 다르게, 실제로는 결과물이 안 쓰이고 빌드만 두 번 도는 낭비였음. 그래서 정리함.
#
# 로컬에서 그냥 `docker build .`만 하면 안 됨 — 먼저 `npm run build`로
# .next/standalone, .next/static을 만들어둬야 함(next.config.js의 output: "standalone" 설정 전제).
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Next.js가 서버 기동 시점에 이 값을 읽어서 /api/* 요청을 백엔드로 프록시함(next.config.js의 rewrites()).
# K8s Deployment의 env가 이 기본값을 덮어씀 — 여기 값은 그 env 설정을 깜빡했을 때의 안전망일 뿐.
ENV CLUSTER_IP=http://qket-backend-service

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# standalone 모드는 public/, .next/static을 자동으로 안 담아줘서 별도로 복사해야 함(Next.js 공식 안내).
COPY public ./public
COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
