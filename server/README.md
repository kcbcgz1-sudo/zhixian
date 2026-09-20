# 知闲 API Server (NestJS + Prisma + PostgreSQL)

## 로컬 실행 (Windows)

사전 준비: **Docker Desktop** 설치.

```bash
# 1) 폴더 진입
cd D:\app\server

# 2) 개발 DB(PostgreSQL) 컨테이너 실행
docker compose up -d

# 3) 의존성 설치 (처음 한 번)
npm install

# 4) Prisma 클라이언트 생성 + DB 테이블 생성(마이그레이션)
npm run prisma:migrate        # 이름 물어보면 아무거나(예: init)

# 5) 시드 데이터 넣기 (게시글 3건)
npm run db:seed

# 6) 서버 실행
npm run start:dev
```

실행되면:
- API: `http://localhost:3000/api`
- 목록: `GET http://localhost:3000/api/posts`  (필터: `?category=fishing|hiking`)
- 상세: `GET http://localhost:3000/api/posts/:id`

## 구조
```
server/
 ├ docker-compose.yml   # 개발용 Postgres
 ├ prisma/
 │  ├ schema.prisma     # 데이터 모델(테이블 정의)
 │  └ seed.ts           # 시드 데이터
 └ src/
    ├ main.ts           # 부트스트랩(CORS, /api prefix)
    ├ app.module.ts
    ├ prisma/           # PrismaService(전역)
    └ posts/            # 게시글 API (list/detail)
```

## 배포(나중, 홍콩)
- 홍콩 VPS(腾讯云/阿里云 경량 or Vultr/DO HK) 우분투에 Docker로 Postgres + 서버 실행.
- ICP备案 불필요(홍콩). 본토 트래픽 커지면 境内+ICP로 이전 검토.
