# Frontend

pnpm workspace — `portfolio`(Next.js, 공개 사이트)와 `admin`(React + Vite, 관리 화면).
계획·결정·실행 방법은 [docs/04-plans/FRONTEND_IMPLEMENTATION.md](../docs/04-plans/FRONTEND_IMPLEMENTATION.md)를 따른다.

```bash
corepack enable && pnpm install   # 저장소 루트에서
pnpm dev:portfolio                # http://localhost:3000 (백엔드 8080 필요)
pnpm dev:admin                    # http://localhost:5173
pnpm test && pnpm lint && pnpm build
```
