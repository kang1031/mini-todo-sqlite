# Data Model: 할 일 관리 (Todo Management)

## Task

spec.md의 "할 일(Todo Item)" 엔티티에 대응하는 유일한 엔티티.

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| `id` | `Int` (autoincrement) | 예(시스템 생성) | 자동 증가 | 내부 고유 식별자. 사용자에게 의미 있는 값으로 노출되지 않는다 (spec Assumptions). |
| `title` | `String` | 예 | 없음 | 할 일 제목. 공백만 있거나 빈 문자열은 허용되지 않는다(FR-002). 다른 항목과 제목이 중복되어도 된다(FR-011). |
| `completed` | `Boolean` | 예 | `false` | 완료 여부. 생성 시 항상 `false`로 시작한다(FR-003). |
| `priority` | `Priority` (enum: `HIGH`/`MEDIUM`/`LOW`) | 예 | `MEDIUM` | 중요도. 생성 시에만 지정 가능하며 이후 변경 기능은 제공하지 않는다(FR-012~014, spec Assumptions). |
| `createdAt` | `DateTime` | 예 | 생성 시각(`now()`) | 목록의 기본 정렬 기준(생성 순서, spec Assumptions). |

### 검증 규칙

- `title`: trim 후 빈 문자열이면 거부(FR-002). 길이 상한은 200자로 가정하며
  초과 시 거부한다(spec Assumptions).
- `completed`: API를 통한 생성 시 클라이언트가 값을 지정할 수 없고 항상 `false`로
  시작한다(FR-003). 변경은 오직 토글 엔드포인트를 통해서만 가능하다(FR-005).
- `id`가 가리키는 Task가 존재하지 않는 경우, 토글/삭제 요청은 오류로 처리되고
  다른 데이터에 영향을 주지 않는다(FR-009).
- `priority`: `HIGH`/`MEDIUM`/`LOW` 중 하나만 허용한다. 생성 요청에 값이 없으면
  `MEDIUM`을 기본값으로 사용하고, 정의되지 않은 값이 오면 거부한다(FR-013,
  FR-014).

### 상태 전이

```text
[생성] → completed = false
completed = false --(토글)--> completed = true
completed = true  --(토글)--> completed = false
(어느 상태든) --(삭제)--> [항목 제거, 이후 모든 작업은 오류]
```

### 관계

다른 엔티티와의 관계 없음 — 단일 엔티티 모델.

### Prisma 스키마 스케치

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}

enum Priority {
  HIGH
  MEDIUM
  LOW
}

model Task {
  id        Int      @id @default(autoincrement())
  title     String
  completed Boolean  @default(false)
  priority  Priority @default(MEDIUM)
  createdAt DateTime @default(now())
}
```

(실제 구현에서 사용한 제너레이터/출력 경로는 research.md #8의 결정을 따른다.)
