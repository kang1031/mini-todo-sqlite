# API Contract: `/api/tasks`

모든 응답은 JSON이며 `Content-Type: application/json`을 갖는다(헌법 원칙 III).
성공 응답은 `{ "data": ... }`, 실패 응답은 `{ "error": { "message": string } }`
형태를 따른다(research.md #4).

## GET /api/tasks

할 일 목록 전체를 생성 순서(오름차순)로 조회한다. → FR-004, User Story 1

**Response 200**:

```json
{
  "data": [
    { "id": 1, "title": "우유 사기", "completed": false, "priority": "MEDIUM", "createdAt": "2026-09-16T00:00:00.000Z" }
  ]
}
```

목록이 비어 있으면 `"data": []`를 반환한다(Edge Case: 빈 목록).

## POST /api/tasks

새 할 일을 추가한다. → FR-001, FR-002, FR-003, FR-011, FR-012, FR-013, FR-014,
User Story 1, User Story 4

**Request Body**:

```json
{ "title": "우유 사기", "priority": "HIGH" }
```

`priority`는 선택 항목이다(`"HIGH"` | `"MEDIUM"` | `"LOW"`). 생략하면 `"MEDIUM"`을
기본값으로 사용한다.

**Response 201** (성공):

```json
{ "data": { "id": 2, "title": "우유 사기", "completed": false, "priority": "HIGH", "createdAt": "2026-09-16T00:00:01.000Z" } }
```

**Response 400** (`title`이 없거나 공백/빈 문자열, 또는 200자 초과):

```json
{ "error": { "message": "Title is required" } }
```

**Response 400** (`priority`가 `"HIGH"`/`"MEDIUM"`/`"LOW"` 중 하나가 아님):

```json
{ "error": { "message": "Priority must be one of HIGH, MEDIUM, LOW" } }
```

## PATCH /api/tasks/{id}

지정한 할 일의 완료 상태를 반전(toggle)한다. 요청 바디는 없다. → FR-005, FR-009, User Story 2

**Response 200** (성공, 반전된 상태 반환):

```json
{ "data": { "id": 2, "title": "우유 사기", "completed": true, "priority": "HIGH", "createdAt": "2026-09-16T00:00:01.000Z" } }
```

**Response 404** (`id`에 해당하는 Task 없음):

```json
{ "error": { "message": "Task not found" } }
```

## DELETE /api/tasks/{id}

지정한 할 일을 영구적으로 삭제한다. → FR-006, FR-009, User Story 3

**Response 200** (성공):

```json
{ "data": { "id": 2 } }
```

**Response 404** (`id`에 해당하는 Task 없음):

```json
{ "error": { "message": "Task not found" } }
```

## 공통 오류 규칙

- 존재하지 않는 `id`에 대한 `PATCH`/`DELETE`는 항상 `404`이며, 다른 Task의 상태는
  변경하지 않는다(FR-009).
- 서버 내부 오류(예상치 못한 예외)는 `500 { "error": { "message": "Internal Server Error" } }`으로 통일한다(헌법 원칙 III).
