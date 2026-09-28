---

description: "Task list template for feature implementation"
---

# Tasks: 할 일 관리 (Todo Management)

**Input**: Design documents from `/specs/001-todo-management/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/tasks-api.md](./contracts/tasks-api.md), [quickstart.md](./quickstart.md)

**Tests**: spec.md에 자동화 테스트가 명시적으로 요청되지 않았고, research.md #5에서 이번
기능은 자동화 테스트 프레임워크를 도입하지 않기로 결정했다. 검증은 헌법의 품질
게이트(`tsc`/`lint`)와 `quickstart.md`의 수동 시나리오로 대체한다(Polish 단계 T018).

**Organization**: Tasks are grouped by user story (spec.md 우선순위 P1 → P2 → P3)
to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Next.js App Router 단일 프로젝트(plan.md Project Structure 기준):
`app/`(UI + API 라우트), `prisma/`(스키마), `lib/`(공용 유틸) — 저장소 루트 기준.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prisma + SQLite 사용을 위한 프로젝트 초기화

- [X] T001 Prisma 의존성 설치: `npm install --save-dev prisma`, `npm install @prisma/client` 실행하여 `package.json`/`package-lock.json` 갱신 (버전을 `6.19.3`으로 고정 — research.md 추신 참고: 기본 `latest`는 로컬 SQLite를 지원하지 않는 Prisma 8 플랫폼 CLI)
- [X] T002 `npx prisma init --datasource-provider sqlite` 실행하여 `prisma/schema.prisma`와 `.env`(`DATABASE_URL="file:./dev.db"`) 생성 (research.md #3)
- [X] T003 [P] `.gitignore`에 `prisma/dev.db`와 `.env`가 포함되어 있는지 확인하고 없으면 추가

**Checkpoint**: Prisma 도구 체인이 설치되고 SQLite datasource가 구성됨

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리가 공유하는 데이터 모델과 공용 유틸리티

**⚠️ CRITICAL**: 이 단계가 끝나기 전에는 어떤 사용자 스토리 작업도 시작할 수 없음

- [X] T004 `prisma/schema.prisma`에 `Task` 모델 정의: `id Int @id @default(autoincrement())`, `title String`(공백/빈 문자열 금지 및 200자 이내 제약은 API 계층에서 검증), `completed Boolean @default(false)`, `createdAt DateTime @default(now())` (data-model.md 참조)
- [X] T005 `npx prisma migrate dev --name init` 실행하여 `prisma/dev.db`에 `Task` 테이블 생성 (depends on T004)
- [X] T006 [P] `lib/prisma.ts`에 `PrismaClient` 싱글턴 생성 — `globalThis` 캐싱 패턴으로 개발 서버 핫리로드 시 연결 누적 방지 (research.md #2, depends on T005)
- [X] T007 [P] `lib/api-response.ts`에 공용 JSON 응답 헬퍼 작성 — 성공 `{ data: T }`, 실패 `{ error: { message: string } }` 형태를 반환하는 제네릭 함수(`any` 타입 사용 금지, 헌법 원칙 II·III / contracts/tasks-api.md)

**Checkpoint**: 데이터 모델과 공용 응답 헬퍼가 준비되어 사용자 스토리 구현을 시작할 수 있음

---

## Phase 3: User Story 1 - 할 일 추가 및 목록 확인 (Priority: P1) 🎯 MVP

**Goal**: 사용자가 제목을 입력해 할 일을 추가하고, 추가된 항목이 목록에 즉시 반영되는
것을 확인할 수 있다 (spec.md User Story 1).

**Independent Test**: 제목을 입력해 할 일을 추가한 뒤, 목록을 열어 방금 추가한 항목이
"미완료" 상태로 표시되는지 확인한다.

### Implementation for User Story 1

- [X] T008 [US1] `app/api/tasks/route.ts`에 `GET` 핸들러 구현 — 모든 `Task`를 `createdAt` 오름차순으로 조회해 `{ data: Task[] }`로 반환 (FR-004; contracts/tasks-api.md `GET /api/tasks`; depends on T006, T007)
- [X] T009 [US1] `app/api/tasks/route.ts`에 `POST` 핸들러 구현 — 요청 body의 `title`을 trim 후 빈 문자열이거나 200자를 초과하면 `400 { error: { message: "Title is required" } }` 반환, 유효하면 `completed: false`로 `Task` 생성 후 `201 { data: Task }` 반환 (FR-001, FR-002, FR-003, FR-011; contracts/tasks-api.md `POST /api/tasks`; depends on T008)
- [X] T010 [US1] `app/page.tsx`에 할 일 추가 폼 UI 구현 — 제목 입력 필드와 제출 버튼, `POST /api/tasks` 호출 후 성공 시 목록을 갱신 (depends on T009)
- [X] T011 [US1] `app/page.tsx`에 할 일 목록 표시 UI 구현 — `GET /api/tasks` 결과를 렌더링하여 각 항목의 제목과 완료 여부를 표시하고, 목록이 비어 있으면 빈 상태 안내 문구를 표시 (FR-004, Edge Case: 빈 목록; depends on T008, T010 — 같은 파일이라 순차 진행)

**Checkpoint**: User Story 1이 독립적으로 완전히 동작하고 테스트 가능함 (추가 → 목록 확인)

---

## Phase 4: User Story 2 - 완료 여부 토글 (Priority: P2)

**Goal**: 사용자가 목록의 특정 할 일을 완료 ↔ 미완료로 전환할 수 있다 (spec.md User
Story 2).

**Independent Test**: 이미 존재하는 할 일 하나를 선택해 완료 토글을 실행한 뒤, 상태가
반대로 바뀌어 표시되는지 확인한다.

### Implementation for User Story 2

- [X] T012 [US2] `app/api/tasks/[id]/route.ts`에 `PATCH` 핸들러 구현 — `id`로 `Task`를 조회해 없으면 `404 { error: { message: "Task not found" } }`, 있으면 현재 `completed` 값을 반전해 저장하고 `200 { data: Task }` 반환 (FR-005, FR-009; research.md #7; contracts/tasks-api.md `PATCH /api/tasks/{id}`; depends on T006, T007)
- [X] T013 [US2] `app/page.tsx`의 각 할 일 항목에 완료 토글 컨트롤(체크박스/버튼) 추가 — 클릭 시 `PATCH /api/tasks/{id}` 호출 후 응답의 `completed` 값으로 화면 상태 갱신 (SC-003; depends on T011, T012)

**Checkpoint**: User Story 1과 2가 모두 독립적으로 동작함

---

## Phase 5: User Story 3 - 할 일 삭제 (Priority: P3)

**Goal**: 사용자가 더 이상 필요 없는 할 일을 목록에서 영구적으로 제거할 수 있다
(spec.md User Story 3).

**Independent Test**: 목록에 있는 할 일 하나를 삭제한 뒤, 그 항목이 더 이상 목록에
나타나지 않는지 확인한다.

### Implementation for User Story 3

- [X] T014 [US3] `app/api/tasks/[id]/route.ts`에 `DELETE` 핸들러 구현 — `id`로 `Task`를 조회해 없으면 `404 { error: { message: "Task not found" } }`, 있으면 삭제 후 `200 { data: { id } }` 반환 (FR-006, FR-009; contracts/tasks-api.md `DELETE /api/tasks/{id}`; depends on T012 — 같은 파일이라 순차 진행)
- [X] T015 [US3] `app/page.tsx`의 각 할 일 항목에 삭제 버튼 추가 — 클릭 시 `DELETE /api/tasks/{id}` 호출 후 성공하면 해당 항목을 화면 목록에서 제거 (SC-004; depends on T011, T014)

**Checkpoint**: 모든 사용자 스토리(추가/조회, 토글, 삭제)가 독립적으로 동작함

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 여러 사용자 스토리에 걸친 마무리 작업 및 헌법 품질 게이트 확인

- [X] T016 [P] 저장소 루트에 `.env.example` 파일 추가 — `DATABASE_URL="file:./dev.db"` 예시 값 문서화 (새 환경에서 설정 방법 안내)
- [X] T017 `npx tsc --noEmit`과 `npm run lint`를 실행해 타입 오류·lint 오류·`any` 타입 사용 여부를 확인하고 모두 통과시킴 (헌법 품질 게이트; depends on T008-T015)
- [X] T018 [quickstart.md](./quickstart.md)의 3개 시나리오(추가/목록, 토글, 삭제)와 완료 기준 체크리스트를 수동으로 실행해 모든 항목을 확인 (depends on T017) — API 레벨 6/8 항목 검증 완료, 브라우저 시각 확인 2개 항목은 quickstart.md에 미검증으로 표시

---

## Phase 7: User Story 4 - 할 일 중요도 지정 및 확인 (Priority: P4)

> P1~P3(Phase 1-6) 구현 완료 후 사용자 요청으로 추가된 후속 기능. spec.md·
> data-model.md·contracts/tasks-api.md도 함께 갱신했다.

**Goal**: 할 일을 추가할 때 중요도(높음/보통/낮음)를 지정하고, 목록의 각 카드에서
중요도를 확인할 수 있다 (spec.md User Story 4).

**Independent Test**: 중요도를 "높음"으로 지정해 할 일을 추가한 뒤, 목록에서 해당
항목에 "높음"이 표시되는지 확인한다.

### Implementation for User Story 4

- [X] T019 [US4] `prisma/schema.prisma`에 `Priority` enum(`HIGH`/`MEDIUM`/`LOW`) 정의, `Task.priority` 필드 추가(기본값 `MEDIUM`), `npx prisma migrate dev --name add_priority` 실행 (FR-012, FR-013; data-model.md)
- [X] T020 [US4] `app/api/tasks/route.ts`의 `POST` 핸들러에 `priority` 검증 로직 추가 — 값이 없으면 `MEDIUM` 기본 적용, `HIGH`/`MEDIUM`/`LOW`가 아니면 `400 { error: { message: "Priority must be one of HIGH, MEDIUM, LOW" } }` 반환 (FR-013, FR-014; contracts/tasks-api.md; depends on T019)
- [X] T021 [US4] `app/page.tsx` 추가 폼에 중요도 선택 `<select>` 추가 — 기본값 "보통", 선택한 값을 `POST /api/tasks` 요청 body에 포함 (depends on T020)
- [X] T022 [US4] `app/page.tsx`의 각 할 일 카드에 중요도 배지 표시(높음/보통/낮음을 색상으로 구분) 추가 (depends on T021)

**Checkpoint**: 모든 할 일 카드에 중요도가 표시되고, 기존 User Story 1~3과 함께
정상 동작함 — API 레벨(생성 시 지정/기본값/잘못된 값 거부)과 `tsc`/`lint` 검증
완료

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 바로 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작 — 모든 사용자 스토리를 막는(BLOCK) 단계
- **User Stories (Phase 3-5)**: 모두 Foundational 완료에 의존
  - US1은 다른 스토리에 의존하지 않음
  - US2, US3는 UI 목록(`app/page.tsx`, T011)이 먼저 있어야 토글/삭제 컨트롤을 붙일 수 있으므로 US1 완료 후 진행 (App Router route 파일(`[id]/route.ts`) 공유로 인해 API 계층도 US1 → US2 → US3 순서로 파일이 누적됨)
- **Polish (Phase 6)**: 원하는 모든 사용자 스토리 완료 후 진행

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 완료 후 시작 가능, 다른 스토리에 의존하지 않음
- **User Story 2 (P2)**: US1의 목록 UI(T011)와 API 라우트 파일(T008/T009) 존재를 전제로 진행 — 기능적으로는 독립적으로 테스트 가능(토글만 검증)하지만 파일 순서상 US1 이후 구현
- **User Story 3 (P3)**: US1의 목록 UI(T011)와 `[id]/route.ts`(T012) 존재를 전제로 진행 — 기능적으로는 독립적으로 테스트 가능(삭제만 검증)하지만 같은 파일에 핸들러를 추가하므로 US2 이후 구현

### Parallel Opportunities

- Setup: T003은 T001·T002와 병렬 가능
- Foundational: T006과 T007은 서로 다른 파일이므로 병렬 가능(T006은 T005 완료 필요)
- Polish: T016은 T017·T018과 병렬 가능

---

## Parallel Example: Foundational Phase

```bash
# T005 완료 후 아래 두 작업을 병렬로 진행 가능
Task: "lib/prisma.ts에 PrismaClient 싱글턴 생성"
Task: "lib/api-response.ts에 공용 JSON 응답 헬퍼 작성"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료 (필수 — 모든 스토리를 막음)
3. Phase 3: User Story 1 완료
4. **STOP and VALIDATE**: quickstart.md 시나리오 1로 독립 검증
5. 필요 시 이 상태로 데모/배포 가능 (추가·조회만 되는 MVP)

### Incremental Delivery

1. Setup + Foundational 완료 → 기반 준비 완료
2. User Story 1 추가 → 독립 검증 → 데모(MVP!)
3. User Story 2 추가 → 독립 검증 → 데모
4. User Story 3 추가 → 독립 검증 → 데모
5. Phase 6 Polish로 마무리 (타입 검사/lint/quickstart 전체 재확인)

---

## Notes

- `[P]` 작업 = 서로 다른 파일, 의존성 없음
- `[Story]` 라벨은 작업을 특정 사용자 스토리에 매핑해 추적성을 제공
- 이번 기능은 자동화 테스트를 도입하지 않으므로 각 스토리의 "Tests" 하위 섹션은
  생략했고, 대신 quickstart.md 수동 시나리오로 대체함(research.md #5)
- 각 작업 완료 후 커밋 권장
- 체크포인트마다 멈춰서 해당 스토리를 독립적으로 검증할 것
