# Admin

Next.js 16 기반 관리자(Admin) 서비스입니다.

- 인증: JWT Access Token + Refresh Token
- 세션 저장소: Redis (Refresh Token/활성 세션 관리)
- DB: PostgreSQL + Prisma
- API: GraphQL Yoga + Next.js Route Handlers
- UI: 관리자 CRUD(사용자/프로젝트/경력), 다국어, 반응형, 토스트 에러 처리
- 배포: Docker + Helm + ArgoCD
- CI: GitHub Actions

## 주요 구현 사항

### 인증/세션

- Access Token + Refresh Token 기반 로그인
- Refresh Token을 Redis에 저장
- 사용자 상세 페이지에서 활성 세션 목록 조회
- 세션별 마지막 IP 확인
- 강제 로그아웃(세션 종료) 지원

### 관리자 기능

- 사용자/프로젝트/경력 생성/수정/삭제
- 삭제 정책: Soft Delete
- 경력(Career) 다국어 번역 편집 지원
- 필터 폼 `onSubmit` 기반 조회
- 빈 데이터 상태를 테이블 내부 Empty Row로 표시
- 모든 API 성공/실패 시 토스트 노출
- 실패 메시지는 서버 응답 우선, 없으면 기본 메시지 사용

### 시간/표시 정책

- DateTime은 UTC 저장
- 클라이언트에서 로컬 타임존으로 변환 표시

### 레이아웃/반응형

- 레이아웃 헤더 고정(sticky)
- 주요 목록/필터/액션 UI 반응형 대응

## 프로젝트 구조

```text
src/
  app/
    admin/            # 관리자 페이지
    api/              # auth/graphql/admin route handlers
  components/         # UI 및 관리자 기능 컴포넌트
  lib/                # auth, prisma, redis, i18n, error util
prisma/               # schema, migrations, seed
helm/admin/           # Helm Chart
.github/workflows/    # GitHub Actions CI/CD
Dockerfile            # Production 이미지 빌드
```

## 로컬 실행

### 1) 의존성 설치

```bash
npm ci
```

### 2) 환경 변수

```bash
cp .env.example .env
```

필수값(최소):

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `REDIS_HOST` 또는 `REDIS_URL`

### 3) DB 마이그레이션/시드

```bash
npm run prisma:migrate
npm run prisma:seed
```

### 4) 개발 서버 실행

```bash
npm run dev
```

- 기본 포트: `3001`
- 접속: `http://localhost:3001`

## 테스트/검증

```bash
npm run lint
npm run test
npm run build
```

## Docker

```bash
docker build -t admin:local .
docker run --rm -p 3001:3001 --env-file .env admin:local
```

## Helm / ArgoCD

차트 경로:

- `helm/admin`

배포 전 점검:

- `helm/admin/values.yaml`의 `image.repository`, `image.tag` 확인
- `secretEnv` 또는 `existingSecret` 설정
- Sentry 사용 시 `secretEnv.SENTRY_DSN`, `secretEnv.NEXT_PUBLIC_SENTRY_DSN` 설정

ArgoCD는 `helm/admin` 경로를 Application으로 등록하여 Sync하도록 구성합니다.

## GitHub Actions CI/CD

워크플로우:

- `.github/workflows/ci-cd.yml`
- Pull Request: 설치/타입체크/린트/테스트/빌드 검증
- Main Push: GHCR 이미지 빌드/푸시 + Helm 이미지 태그 업데이트 커밋

필수 GitHub Secrets:

- `SENTRY_AUTH_TOKEN`

파이프라인 동작:

1. Checkout
2. Install (`pnpm install --frozen-lockfile`)
3. Verify (`tsc`, `lint`, `test`, `build`)
4. Main 브랜치에서 Docker Buildx로 GHCR 빌드/푸시
5. Helm values 태그 업데이트 후 커밋/푸시 (`[skip ci]`)

## 참고

- 운영 환경에서는 `.env.example`의 값들을 실제 보안 값으로 교체하세요.
- 토큰/DB/Redis/Kafka/모니터링 계정은 반드시 Secret 관리 체계(K8s Secret, Vault 등)로 운영하세요.
