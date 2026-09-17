# Reference Documents Implementation

Status: Done (2026-09-17, 샘플 시드 재실행만 남음)

**Spec:** [ADR-0005 후속 결정](../03-decisions/ADR-0005-content-and-document-model.md), [API_DESIGN 참고 문서](../02-design/API_DESIGN.md), [DATA_MODEL document_relation](../02-design/DATA_MODEL.md).

## 결정 (2026-09-17 사용자)

- 프로젝트·블로그 상세에 "참고 문서"와 "이 문서를 참고한 문서"를 나눠 표시한다.
- 연결 종류는 `RELATED_TO` 하나를 "참고"로 정의(A). 스키마 변경 없음.
- 연결 대상은 프로젝트·블로그만. 비공개 문서는 공개 화면의 두 목록에서 제외.

## 작업

1. [x] 결정·설계 문서 반영(ADR-0005, DATA_MODEL, CONTENT_SPEC, API_DESIGN)
2. [x] 백엔드: `content/DocumentReferences`(검증·교체·조회), 관리 요청 `references`, 관리/공개 상세 `references`·`referencedBy`
3. [x] 시드: 방향 그대로 저장, 샘플의 상호 중복 기재를 한 방향으로 정리(관계 4건 유지)
4. [x] 테스트: `ReferenceDocumentsApiTest`
5. [x] 어드민: 프로젝트·블로그 편집에 참고 문서 선택, 이 문서를 참고한 문서(읽기 전용)
6. [x] 포트폴리오: 상세 하단 두 목록
7. [x] 사용자 로컬 검증: 백엔드 116건 통과, 프론트 test·lint·build 통과(포트폴리오 테스트 정리 누락 1건 수정 후), 어드민·포트폴리오 화면 확인
8. [ ] 개발 DB 샘플 시드 재실행(연결 방향 web-serial-usb→offline-first-boundary로 갱신) — 미확인

## 남은 것

- Graph View에서 방향 표시(화살표)는 Graph 착수 시 정한다.
