# Phase 0 Research: 할 일 관리 (Todo Management)

## 1. REST 엔드포인트 구현 방식

**Decision**: Next.js App Router의 Route Handler(`app/api/tasks/route.ts`,
`app/api/tasks/[id]/route.ts`)로 REST 엔드포인트를 구현한다.

**Rationale**: 사용자가 명시적으로 요청한 방식이며, 헌법 원칙 I(Next.js App Router
아키텍처)과 정확히 일치한다. Route Handler는 `GET`/`POST`/`PATCH`/`DELETE` 같은
HTTP 메서드별 함수를 그대로 export하여 REST 시맨틱을 자연스럽게 표현할 수 있다.

**Alternatives considered**:
- Pages Router의 `pages/api/*` — 구버전 라우팅 방식이라 헌법 원칙 I 위반으로 기각.
- 별도의 Express/Fastify 서버 — 사용자가 "별도의 서버 설정이나 외부 서비스 가입은
  필요 없다"고 명시했으므로 기각.

## 2. ORM 및 데이터베이스 접근

**Decision**: Prisma ORM(`@prisma/client` + `prisma` CLI)을 사용하고, datasource는
SQLite, 연결 문자열은 `file:./dev.db`(즉 `prisma/dev.db`)로 설정한다.
`lib/prisma.ts`에 `PrismaClient` 싱글턴을 두어 Next.js 개발 서버의 핫리로드 시
연결이 누적되는 문제를 방지한다(Prisma 공식 Next.js 통합 가이드에서 권장하는
`globalThis` 캐싱 패턴).

**Rationale**: 사용자가 명시적으로 Prisma + 로컬 SQLite 파일을 요청했다. 싱글턴
패턴은 Prisma가 Next.js 문서에서 공식적으로 권장하는 방식이며, 매 요청마다 새
`PrismaClient`를 생성하면 개발 중 "too many connections" 류의 문제가 발생할 수
있다.

**Alternatives considered**:
- `node:sqlite` 또는 `better-sqlite3`를 직접 사용 — 사용자가 Prisma를 명시적으로
  요청했으므로 기각.
- 요청마다 새 `PrismaClient` 인스턴스 생성 — 핫리로드 환경에서 연결이 누적되는
  문제로 기각.

## 3. 데이터 저장 위치

**Decision**: SQLite 파일은 `prisma/dev.db`에 두고, `.gitignore`에 추가해 저장소에
커밋하지 않는다. `DATABASE_URL` 환경 변수(`.env`)로 경로를 관리한다.

**Rationale**: 사용자가 "로컬 SQLite 파일(dev.db)"을 명시했다. 파일 기반 저장소는
FR-007(세션 종료 후에도 목록 유지)을 만족하며, 외부 서비스 가입이 필요 없다.

**Alternatives considered**:
- 인메모리 SQLite(`:memory:`) — 프로세스 재시작 시 데이터가 사라져 FR-007을
  위반하므로 기각.

## 4. API 응답 형식

**Decision**: 모든 Route Handler는 성공 시 `{ "data": <payload> }`, 실패 시
`{ "error": { "message": string } }` 형태의 JSON만 반환한다. 성공적인 삭제도
`204 No Content`가 아닌 `200 { "data": { "id": number } }`으로 응답해 항상 JSON
바디를 유지한다.

**Rationale**: 헌법 원칙 III(일관된 JSON API 응답)은 모든 응답이 JSON 형식으로
통일되어야 함을 요구한다. `204 No Content`는 바디가 없어 이 요구와 충돌할 수 있으므로
피한다. `data`/`error` 봉투 구조는 클라이언트가 성공/실패를 일관되게 분기 처리할 수
있게 한다.

**Alternatives considered**:
- 봉투 없이 데이터를 그대로 반환 — 성공/실패 구분이 응답마다 달라질 수 있어
  일관성이 떨어지므로 기각.
- GraphQL — 사용자가 REST 엔드포인트를 명시적으로 요청했으므로 기각.

## 5. 자동화 테스트 전략

**Decision**: 이번 기능에서는 별도의 테스트 프레임워크(Vitest/Jest 등)를 새로
도입하지 않는다. 검증은 (a) 헌법이 이미 요구하는 `tsc` 타입 검사와 `npm run lint`,
(b) `quickstart.md`에 정리된 수동 curl/브라우저 시나리오로 수행한다.

**Rationale**: 헌법의 "품질 게이트" 섹션은 타입 검사와 lint만을 필수로 규정하며
TDD/자동화 테스트를 요구하지 않는다. 이 기능은 범위가 작은(mini) 할 일 앱이므로,
스펙의 승인 시나리오(Given/When/Then)를 수동 검증 절차로 그대로 옮기는 것으로
충분하다. 불필요한 테스트 인프라 도입은 YAGNI 원칙에 어긋난다.

**Alternatives considered**:
- Vitest + Route Handler 단위/계약 테스트 도입 — 범위에 비해 과도한 인프라라고
  판단해 이번 기능에서는 보류(향후 필요 시 별도로 추가 가능).

## 6. 식별자(Task ID) 전략

**Decision**: Prisma 스키마에서 `id`는 `Int @id @default(autoincrement())`로
정의한다.

**Rationale**: 단일 사용자 로컬 SQLite 환경에서는 정수 자동 증가 ID로 충분하며,
spec의 Assumptions("사용자에게 노출되는 필드가 아닌 내부 고유 식별자")와도 부합한다.
Prisma + SQLite에서 가장 단순하고 관례적인 선택이다.

**Alternatives considered**:
- `cuid()`/`uuid()` 문자열 ID — 다중 서버·분산 환경에서 충돌을 피하기 위한
  선택이지만, 이 기능은 단일 로컬 SQLite 파일을 사용하므로 불필요한 복잡성으로
  기각.

## 7. 완료 토글(Toggle) 동작 방식

**Decision**: `PATCH /api/tasks/[id]`는 요청 바디 없이(또는 바디를 무시하고)
서버에서 현재 `completed` 값을 읽어 반대로 뒤집는 방식으로 구현한다.

**Rationale**: spec의 FR-005는 "완료 ↔ 미완료 전환(토글)"을 요구하며, 클라이언트가
목표 상태를 직접 지정하는 것이 아니라 현재 상태의 반전을 요청하는 것이 사용자
시나리오("토글 버튼 클릭")와 가장 자연스럽게 대응된다.

**Alternatives considered**:
- 클라이언트가 원하는 `completed` 값을 body로 전달 — 더 유연하지만 spec이 요구하는
  범위를 넘어서므로 이번 기능에서는 채택하지 않는다(추후 필요 시 확장 가능).

## Output

모든 NEEDS CLARIFICATION 항목이 해결되었다. Phase 1(데이터 모델·계약·quickstart)로
진행할 수 있다.

## 8. (구현 중 발견) Prisma 패키지 버전 고정

**Decision**: `prisma`/`@prisma/client`를 `6.19.3`으로 고정 설치한다(버전 미지정 시
`latest`가 설치되는 것을 방지).

**Rationale**: 구현 시점에 `npm install prisma`의 `latest`는 `8.0.0-rc.15`였는데, 이
버전은 완전히 새로운 "Prisma Platform" 아키텍처(Composer/Compute, `prisma orm init`
마법사)로 개편되어 있었고 `--target` 옵션이 `postgres`/`mongodb`만 지원해 로컬
SQLite를 1급으로 지원하지 않았다(로컬 스택은 Windows 미지원이기도 함). 이는 사용자가
명시한 "로컬 SQLite 파일 사용, 외부 서비스 가입 불필요" 요구사항과 정면으로
충돌한다. 반면 `6.19.3`(`prev` dist-tag)은 클래식 `prisma init --datasource-provider
sqlite` → `prisma/schema.prisma` → `prisma migrate dev` 흐름을 그대로 지원해 plan.md·
data-model.md에 정의한 설계와 일치한다.

**Alternatives considered**:
- 최신 `prisma@8` 그대로 사용 — Postgres/MongoDB 관리형 플랫폼 가입이 필요해
  사용자의 명시적 요구사항(외부 서비스 불필요)을 위반하므로 기각.
- `@prisma/adapter-better-sqlite3` 드라이버 어댑터로 v8에서 SQLite를 우회 지원 —
  기술적으로는 가능해 보이나 이 버전(rc)에서 검증되지 않은 조합이며, 이번
  "mini" 기능의 범위에 비해 위험도가 높아 기각.

**참고**: `prisma init`이 생성한 `generator client`는 `provider = "prisma-client"`
(신규 ESM 클라이언트, 출력 경로 `app/generated/prisma`)이며, 과거의
`provider = "prisma-client-js"`(출력 `node_modules/@prisma/client`)와 다르다. 이
문서 및 data-model.md 초안에 적었던 `prisma-client-js` 표기는 참고용 스케치였고,
실제 구현은 `prisma init`이 생성한 기본값(`prisma-client`, `app/generated/prisma`)을
그대로 따른다.

## 9. (구현 중 발견) `DATABASE_URL`을 절대 경로로 지정

**Decision**: `.env`의 `DATABASE_URL`을 `file:./dev.db`나 `file:./prisma/dev.db` 같은
상대 경로 대신 `file:C:/AS/mini-todo-sqlite/prisma/dev.db`처럼 이 저장소의 절대
경로로 지정한다.

**Rationale**: 신규 `prisma-client` 제너레이터가 생성한 클라이언트는 자신의
`import.meta.url`(즉 생성된 모듈 파일 위치)을 기준으로 상대 경로를 계산해
SQLite 파일을 연다. 그런데 `next dev`(Turbopack)가 이 생성된 클라이언트 모듈을
`.next/dev/server/chunks/...` 아래 하나의 번들 파일로 합치면서 `import.meta.url`이
원래의 `app/generated/prisma/client.ts` 위치가 아닌 번들 파일 위치를 가리키게 되고,
그 결과 상대 경로 기준점이 틀어져 `Error code 14: Unable to open the database
file` 오류가 발생했다(개발 중 `GET/POST /api/tasks` 요청이 실제로 500을 반환하는
것을 확인). 절대 경로를 쓰면 이 기준점 계산 자체가 필요 없어져 문제가 사라진다.
`.env`는 이미 git에 커밋되지 않으므로(`.gitignore`), 로컬 절대 경로를 적어도 다른
환경에 영향을 주지 않는다.

**Alternatives considered**:
- 상대 경로를 유지하고 Turbopack 대신 클래식 webpack 데브 서버로 전환 — 이번
  기능의 범위를 넘어서는 빌드 설정 변경이라 기각.
- 런타임에 `path.join(process.cwd(), "prisma/dev.db")`로 URL을 계산 — `.env`
  파일은 정적 값만 가질 수 있어 이 방식은 별도의 부트스트랩 코드가 필요하므로,
  이 "mini" 기능 범위에서는 과도한 복잡성으로 기각.

**참고**: 새 환경에서 이 저장소를 내려받아 실행할 때는 `.env.example`을 복사한 뒤
`DATABASE_URL`을 해당 환경의 실제 절대 경로로 고쳐야 한다(quickstart.md 참고).
