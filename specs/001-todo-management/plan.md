# Implementation Plan: 할 일 관리 (Todo Management)

**Branch**: `001-todo-management` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-todo-management/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

사용자가 할 일을 추가·조회·완료 토글·삭제할 수 있는 기능. Next.js(App Router)의
Route Handler(`app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`)로 REST
엔드포인트를 제공하고, Prisma ORM을 통해 로컬 SQLite 파일(`prisma/dev.db`)에 데이터를
저장한다. 별도의 서버 프로세스나 외부 서비스 가입 없이 `next dev`/`next start`만으로
동작한다.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, `tsconfig.json`에 `"strict": true`),
Node.js (Next.js 16 런타임이 요구하는 버전)

**Primary Dependencies**: Next.js 16 (App Router, Route Handlers), React 19,
Prisma ORM(`prisma` CLI + `@prisma/client`), 기존 Tailwind CSS 4 (UI 스타일링)

**Storage**: 로컬 SQLite 파일(`prisma/dev.db`), Prisma의 `sqlite` datasource로 접근

**Testing**: 별도 자동화 테스트 프레임워크는 도입하지 않음 — 헌법의 필수 품질
게이트(`tsc` 타입 검사 + `npm run lint`)와 `quickstart.md`의 수동 검증 시나리오로
확인한다 (근거: research.md 참고)

**Target Platform**: 웹 브라우저(클라이언트) + Node.js 서버 런타임(로컬 개발/자체
호스팅), 외부 서비스 불필요

**Project Type**: 웹 애플리케이션 — Next.js App Router 단일 프로젝트(프런트엔드 UI와
API 라우트가 한 프로젝트 안에 공존)

**Performance Goals**: 특별히 엄격한 목표 없음 — 로컬 SQLite 읽기/쓰기는 일반적으로
수십 ms 이내에 완료되며, 이는 spec의 SC-001~SC-004(사용자 조작 1회/10초 이내)를
충분히 만족한다

**Constraints**: 외부 서비스 가입이나 별도 서버 설정 없이 로컬에서 완결되어야 함
(사용자 입력); 모든 API 응답은 JSON 통일(헌법 III); `any` 타입 금지(헌법 II)

**Scale/Scope**: 단일 사용자, 개인 규모의 할 일 개수(수십~수천 건 수준) — spec의
Assumptions에 따라 이 기능 범위에서 별도 상한을 두지 않음

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 게이트 | 상태 |
|---|---|---|
| I. Next.js App Router 아키텍처 | REST 엔드포인트를 `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts` Route Handler로 구현하고, Pages Router는 사용하지 않는다 | PASS |
| II. TypeScript 전용 및 any 금지 | 모든 코드는 `.ts`/`.tsx`로 작성하고, Prisma가 생성하는 타입(`Task`)을 그대로 사용하며 `any`/`as any`/`@ts-ignore`를 쓰지 않는다 | PASS |
| III. 일관된 JSON API 응답 | 모든 Route Handler는 성공 시 `{ "data": ... }`, 실패 시 `{ "error": { "message": string } }` 형태의 JSON만 반환하고 `Content-Type: application/json`을 유지한다 | PASS |

위반 사항 없음 — Complexity Tracking 테이블은 작성하지 않는다.

## Project Structure

### Documentation (this feature)

```text
specs/001-todo-management/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── tasks-api.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
app/
├── layout.tsx                 # 기존 루트 레이아웃
├── page.tsx                   # 할 일 목록 UI (추가/조회/토글/삭제 진입점)
├── globals.css                # 기존 전역 스타일
└── api/
    └── tasks/
        ├── route.ts           # GET(목록 조회), POST(할 일 추가)
        └── [id]/
            └── route.ts       # PATCH(완료 토글), DELETE(삭제)

prisma/
└── schema.prisma              # Task 모델 정의 (SQLite datasource)
                                # prisma/dev.db는 `prisma migrate`가 생성하는
                                # 로컬 SQLite 파일이며 git에는 포함하지 않는다

lib/
└── prisma.ts                  # PrismaClient 싱글턴 (Next.js 개발 서버 핫리로드 대응)
```

**Structure Decision**: Next.js App Router 단일 프로젝트 구조(Option 1 계열)를
사용한다. 프런트엔드(페이지)와 백엔드(API 라우트)가 같은 `app/` 트리 아래 공존하므로
별도의 `backend/`·`frontend/` 분리는 하지 않는다. Prisma 관련 파일은 관례에 따라
저장소 루트의 `prisma/`에, DB 접근 싱글턴은 `lib/prisma.ts`에 둔다.

## Complexity Tracking

> 해당 없음 — Constitution Check 위반 사항이 없으므로 이 표는 작성하지 않는다.
