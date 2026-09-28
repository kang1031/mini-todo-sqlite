# Quickstart: 할 일 관리 (Todo Management)

이 문서는 구현이 끝난 뒤 기능이 spec.md의 승인 시나리오대로 동작하는지 수동으로
검증하기 위한 절차다. API 세부 스펙은 [contracts/tasks-api.md](./contracts/tasks-api.md),
데이터 모델은 [data-model.md](./data-model.md)를 참고한다.

## 사전 준비

```bash
npm install
npx prisma migrate dev --name init   # prisma/dev.db 생성 및 Task 테이블 마이그레이션
npm run dev                          # http://localhost:3000
```

**중요**: `.env`의 `DATABASE_URL`은 반드시 이 저장소의 **절대 경로**로 설정해야
한다(예: `file:C:/AS/mini-todo-sqlite/prisma/dev.db`). `file:./dev.db` 같은 상대
경로는 Turbopack 번들링 환경에서 기준 경로가 어긋나 `Unable to open the database
file` 오류를 일으킨다(research.md #9 참고). `.env.example`을 복사한 뒤 실제 절대
경로로 값을 고쳐서 사용할 것.

## 시나리오 1: 할 일 추가 및 목록 확인 (User Story 1, P1)

```bash
# 1) 빈 목록 확인
curl -s http://localhost:3000/api/tasks
# 기대: {"data":[]}

# 2) 할 일 추가
curl -s -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"우유 사기"}'
# 기대: 201, {"data":{"id":1,"title":"우유 사기","completed":false,...}}

# 3) 목록에 반영되었는지 확인
curl -s http://localhost:3000/api/tasks
# 기대: {"data":[{"id":1,"title":"우유 사기","completed":false,...}]}

# 4) 빈 제목 거부 확인
curl -s -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"   "}'
# 기대: 400, {"error":{"message":"Title is required"}}
```

브라우저(`http://localhost:3000`)에서도 같은 흐름(입력 → 추가 → 목록에 표시)이
UI로 동작하는지 확인한다.

**참고(Windows/Git Bash 사용 시)**: Git Bash에서 `curl -d '{"title":"한글 제목"}'`처럼
한글을 셸 인자로 직접 넘기면 `curl.exe`로 전달되는 과정에서 인코딩이 깨질 수 있다
(애플리케이션/DB 문제가 아니라 셸-네이티브 바이너리 간 인자 인코딩 이슈). 한글
제목을 확실히 검증하려면 브라우저 UI를 사용하거나, `fetch`로 JSON 바디를 만드는
Node 스크립트를 사용할 것.

## 시나리오 2: 완료 여부 토글 (User Story 2, P2)

```bash
# 방금 추가한 id=1 항목 토글
curl -s -X PATCH http://localhost:3000/api/tasks/1
# 기대: 200, {"data":{"id":1,...,"completed":true}}

# 다시 토글하면 원상 복귀
curl -s -X PATCH http://localhost:3000/api/tasks/1
# 기대: 200, {"data":{"id":1,...,"completed":false}}

# 존재하지 않는 id 토글
curl -s -X PATCH http://localhost:3000/api/tasks/9999
# 기대: 404, {"error":{"message":"Task not found"}}
```

브라우저에서 체크박스/토글 버튼 클릭 1회로 상태가 즉시 바뀌는지 확인한다(SC-003).

## 시나리오 3: 할 일 삭제 (User Story 3, P3)

```bash
curl -s -X DELETE http://localhost:3000/api/tasks/1
# 기대: 200, {"data":{"id":1}}

curl -s http://localhost:3000/api/tasks
# 기대: {"data":[]}  (해당 항목이 더 이상 보이지 않음)

# 이미 삭제된 id 재삭제
curl -s -X DELETE http://localhost:3000/api/tasks/1
# 기대: 404, {"error":{"message":"Task not found"}}
```

## 완료 기준 체크리스트

- [ ] 빈 목록/항목 있는 목록이 모두 올바르게 표시된다 (⚠️ 브라우저 시각 확인 필요 — 아래 참고)
- [x] 빈/공백 제목 추가가 거부된다(400) — API 레벨로 검증 완료
- [ ] 추가한 항목이 목록에 즉시 반영된다(새로고침 없이, SC-002) (⚠️ 브라우저 시각 확인 필요)
- [x] 토글이 완료 ↔ 미완료를 정확히 오간다 — API 레벨로 검증 완료
- [x] 삭제 후 항목이 목록에서 사라지고 나머지 항목은 유지된다 — API 레벨로 검증 완료
- [x] 존재하지 않는 id에 대한 토글/삭제는 404이며 다른 항목에 영향을 주지 않는다(FR-009) — API 레벨로 검증 완료
- [x] 모든 응답이 JSON이며 `data`/`error` 봉투 형식을 따른다(헌법 원칙 III) — API 레벨로 검증 완료
- [x] `npx tsc --noEmit`과 `npm run lint`가 통과한다(헌법 품질 게이트) — 통과 확인

**참고**: 이번 구현 세션에는 브라우저 자동화 도구가 없어 API(`GET`/`POST`/`PATCH`/
`DELETE /api/tasks`)는 Node `fetch` 스크립트로 직접 호출해 전부 검증했지만, 실제
브라우저에서 폼 입력·체크박스 클릭 후 화면이 갱신되는 모습은 육안으로 확인하지
못했다. `npm run dev` 실행 후 `http://localhost:3000`을 브라우저로 열어 위 두
항목(⚠️ 표시)을 직접 확인할 것을 권장한다.
