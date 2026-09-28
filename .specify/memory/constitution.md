<!--
Sync Impact Report
- Version change: (none) → 1.0.0
- Modified principles: none (initial ratification)
- Added sections:
  - Core Principles: I. Next.js App Router 아키텍처, II. TypeScript 전용 및 any 금지, III. 일관된 JSON API 응답
  - 품질 게이트 (Section 2)
  - 리뷰 및 규정 준수 (Section 3)
  - Governance
- Removed sections: none
- Templates requiring updates: none checked in this run (dependent templates read the
  constitution at runtime per command scope guard; not modified here)
- Follow-up TODOs: none — all placeholders resolved from user input and repo context
  (package.json confirms Next.js 16 + TypeScript 5 stack)
-->

# mini-todo-sqlite Constitution

## Core Principles

### I. Next.js App Router 아키텍처
프로젝트는 Next.js(App Router)와 TypeScript로 작성한다. `pages/` 디렉터리 기반의 구
Pages Router 규칙은 사용하지 않으며, 라우팅·레이아웃·서버 컴포넌트는 App Router
(`app/` 디렉터리) 규칙을 따른다.
**근거**: App Router는 이 프로젝트가 채택한 유일한 라우팅 모델이며, 두 라우팅 방식이
혼재하면 파일 구조와 데이터 페칭 방식에 대한 혼동이 생긴다.

### II. TypeScript 전용 및 any 금지 (NON-NEGOTIABLE)
모든 소스 코드는 TypeScript(`.ts`/`.tsx`)로 작성한다. `any` 타입은 어떤 경우에도
사용하지 않는다. 타입을 알 수 없는 값은 `unknown`으로 선언한 뒤 타입 가드로 좁히거나,
정확한 타입/제네릭을 정의해야 한다. 외부 라이브러리 타입이 없을 경우 최소한의 타입
선언 파일을 작성한다.
**근거**: `any`는 TypeScript의 타입 검사를 무력화하여 런타임 오류를 컴파일 타임에
잡아내지 못하게 만든다. 이 프로젝트는 타입 안전성을 코드 품질의 핵심 기준으로 삼는다.

### III. 일관된 JSON API 응답
모든 API 라우트(`app/api/**/route.ts`)의 응답은 항상 JSON 형식으로 통일한다. 성공과
실패 응답 모두 동일한 JSON 구조 규칙을 따라야 하며, 응답의 `Content-Type`은
`application/json`이어야 한다. HTML, 텍스트, 혹은 형식이 통일되지 않은 임시 응답을
반환해서는 안 된다.
**근거**: 응답 형식을 통일하면 클라이언트(프런트엔드 및 테스트 코드)가 예측 가능한
방식으로 API를 소비할 수 있고, 오류 처리 로직을 단순화할 수 있다.

## 품질 게이트

모든 변경 사항은 병합 전에 다음을 만족해야 한다: (1) `tsc`를 통한 타입 검사 통과,
(2) `npm run lint` 통과, (3) 원칙 II에 따라 `any` 타입이 신규로 도입되지 않았는지
확인. 위 게이트를 우회하기 위한 타입 단언 남용(`as any`, `@ts-ignore` 등)은 원칙 II
위반으로 간주한다.

## 리뷰 및 규정 준수

모든 PR 및 코드 리뷰는 위 세 가지 핵심 원칙(App Router 사용, TypeScript 전용/any
금지, JSON 응답 통일) 준수 여부를 확인해야 한다. 원칙을 위반하는 복잡성이나 예외가
필요한 경우, 그 사유를 PR 설명에 명시하고 리뷰어의 승인을 받아야 한다. 이 문서와
충돌하는 관행이 발견되면 헌법이 우선한다.

## Governance

본 헌법은 이 프로젝트의 다른 모든 개발 관행에 우선한다. 헌법 개정은 다음 절차를
따른다: (1) 변경 제안을 문서화, (2) 영향받는 원칙과 버전 범프 유형(MAJOR/MINOR/PATCH)
명시, (3) 유지관리자 승인 후 `.specify/memory/constitution.md`에 반영.

버전 관리는 시맨틱 버저닝을 따른다: 기존 원칙의 하위 호환 불가능한 제거·재정의는
MAJOR, 신규 원칙 추가나 실질적인 지침 확장은 MINOR, 문구 수정이나 명확화는 PATCH로
분류한다.

**Version**: 1.0.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16
