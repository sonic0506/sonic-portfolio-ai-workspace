# Session Log

세션별 주요 작업 이력을 누적 기록한다. 최신 기록은 위쪽에 추가한다.

---

## 2026-09-10 — Plan Status Corrected

- 사용자가 CURRENT_PLAN의 미체크 항목 두 개를 지적해 실제 상태를 대조했다.
- **직전 세션에서 "배포/인증/모델 등 남은 기술 결정" 줄을 체크하는 대신 비슷한 새 줄을 추가하는 실수를 했다.** 중복 줄을 제거했다.
- 해당 항목은 실제로도 미완이다. 배포(ADR-0003)와 모델(ADR-0006/0007)은 끝났으나 인증 상세, 비용 검증, 호환성 검증이 남았다. 하위 체크박스로 분해해 진행 상황이 드러나게 했다.
- "시스템 아키텍처 확정"은 정직하게 미완이다. ARCHITECTURE.md가 Draft이고 Pending Decisions 5건(인증 세션, API Style, Graph 라이브러리, S3/Markdown 저장, 의존성·빌드 도구)이 남아 있다. 해소된 2건(배포, 모델)을 목록에서 정리했다.
- **CURRENT_STATE의 "구현 시작 전 필요한 핵심 결정은 남아 있지 않다"는 과장이었다.** 설계 문서 5개가 모두 Draft이고 Definition of Done은 그중 셋이 Accepted일 것을 요구한다. 해당 문장을 실제 잔여 항목 목록으로 교체했다.
- Current Phase 표기를 Phase 1~2에서 Phase 3(개발 설계)으로 갱신했다.
- 검증: 계획 문서와 설계 문서 Status를 대조했다. 코드 변경 없음.
- 다음: 아키텍처 Pending 5건을 해소해 ARCHITECTURE를 Accepted로 올리거나, 구현과 병행할 항목을 구분한다.

## 2026-09-10 — RAG Model ADRs Accepted

- 사용자가 ADR-0006(임베딩 모델·차원·검색 정책)과 ADR-0007(생성 모델·답변 프롬프트)을 그대로 채택했다. 둘 다 Accepted로 올렸다.
- ADR-0001~0007이 모두 Accepted가 됐다. 구현 시작에 필요한 핵심 결정은 남아 있지 않다.
- RAG_DESIGN의 "초기 구현 조합 제안 — 미확정" 절을 "구현 조합 — 확정"으로 바꾸고 측정 근거를 연결했다. 세션 이력 저장과 Relation 확장 구현은 여전히 Draft다.
- DATA_MODEL의 남은 결정에서 임베딩/생성 모델 항목을 해소 처리했다.
- ADR-0006 결정 5(Hybrid search)는 검토 대상 승격까지이며 도입 확정이 아님을 ADR과 CURRENT_STATE에 명시했다. Spring AI 채택 여부와 버전 호환성도 미검증으로 남는다.
- 검증: ADR 상태와 참조 문서 대조만 수행했다. 새 측정이나 코드 변경은 없다.
- 다음: Spring Boot 프로젝트 생성과 ERD 마이그레이션 작성(Roadmap Phase 5).

## 2026-09-10 — Measurements Archived

- 실측값이 실행 로그에만 남아 사라지는 문제를 정리했다. `docs/06-testing/RAG_MEASUREMENTS.md`를 수치의 기준 문서로 만들었다.
- 청킹·검색·답변 세 측정의 원본 수치를 모두 옮겼다. 검색은 질문 7개의 상위 5건 전체 점수, 답변은 근거 부족 거부와 비공개 미유출, 기여 경계 보존 사례를 원문으로 보관했다.
- "측정이 바꾼 결정" 표로 각 수치가 어떤 스키마·ADR 변경을 유발했는지 추적 가능하게 했다.
- 하네스에 `--save`를 추가했다. 이후 실행은 `poc/results/<날짜>-<명령>.json`에 원본을 남긴다. 청킹은 재실행해 JSON 원본을 확보했고, 검색·답변은 도입 전 실행이라 로그에서 옮긴 값임을 명시했다.
- DOCUMENT_RULES 1절에 따라 poc/README와 ADR-0006/0007, RAG_TEST_CASES의 중복 수치를 기준 문서 링크로 정리했다.
- 검증: `selftest` 통과, `chunks --save` 재실행으로 JSON 원본 생성 확인. 추가 API 호출은 하지 않았다.
- 다음: ADR-0006/0007 확정 후 Spring Boot 프로젝트 생성(Roadmap Phase 5).

## 2026-09-10 — Answer Generation Measured

- `poc/rag_eval.py`에 `answer` 명령을 추가하고 실행했다. `gpt-4.1-mini`, `temperature 0`, 검색 상위 5건 전달.
- **질문 7개 모두 기대대로 동작했다.**
- OAuth 질문은 검색이 각 프로젝트의 "트러블슈팅" 섹션 5건을 넘겼는데도 모델이 "근거에 등록되어 있지 않습니다"로 거부했다. ADR-0006 결정 3의 전제가 검증됐다(RAG-003).
- "오프라인 우선 앱에서 동기화 충돌"은 비공개 글 주제와 거의 같은 질문인데 답변이 공개 원본 `syncmaster`만 사용했다. RAG-007이 생성 단계까지 통과했다.
- viora 원문의 "단독 담당"과 "논의 참여" 구분이 답변에서 유지됐다. 논의 참여를 단독 수행으로 승격하지 않았다.
- 인용 번호가 문서 수준으로는 정확했으나 문장 단위 귀속은 느슨했다. 출처 표시 단위를 문서로 정하는 근거로 삼았다.
- ADR-0007(생성 모델·답변 프롬프트)을 Proposed로 작성했다. 임베딩과 별도 ADR로 둔 이유는 교체 비용이 다르기 때문이다.
- 작성 중 편집 실수로 망가진 f-string을 수정했다. `selftest` 통과 확인 후 실행했다.
- 검증: 실제 API 호출 결과다. 유도 질문·비교 질문·대화 이력 악용은 미측정이고, 세션 기능 평가 사례는 구현이 없어 측정 불가다.
- 다음: ADR-0006/0007 확정 후 Spring Boot 프로젝트 생성과 마이그레이션 작성(Roadmap Phase 5).

## 2026-09-09 — Retrieval Measured

- 사용자가 제공한 OpenAI 키로 `poc/rag_eval.py search`를 실행했다. 공개 문서 5건 / 35청크 / 질문 7개.
- **기대 출처 포함 7/7.** 상위 1건 점수는 0.372~0.678이었다. 임베딩 차원은 실측 1536이다.
- 비공개 문서 `offline-first-boundary`가 7개 질문의 상위 결과에 한 번도 등장하지 않았다. 그 글 제목과 거의 같은 질문에서도 공개 원본 `syncmaster`가 0.520으로 최상위였다. RAG-007이 검색 단계에서 통과했다.
- 근거 없는 질문(OAuth)의 상위 점수가 0.342로, 근거 있는 질문의 최저 0.372와 간격이 0.030에 불과했다. 유사도 임계값으로 근거 부족을 판정할 수 없다는 결론이다. 상위 3건이 모두 각 프로젝트의 "트러블슈팅" 섹션이었고, 질문의 단어가 섹션 제목과 매칭된 결과였다.
- 기술명 조회("React Native" 0.372)가 최저였다. Hybrid search를 Backlog에서 검토 대상으로 승격했다.
- ADR-0006을 **Proposed**로 작성했다: 임베딩 모델 확정, 청킹 규칙, 근거 판정은 생성 단계, 상위 K 5. 생성 모델은 측정하지 않아 결정에서 제외했다.
- DATA_MODEL의 `vector(1536)`을 실측 근거로 갱신하고 RAG_TEST_CASES에 측정 결과를 기록했다.
- 검증: 실제 API 호출 결과다. pgvector HNSW 근사 검색과 답변 생성 품질은 미측정이다. 표본은 문서 5건, 질문 7개다.
- **API 키가 대화에 노출됐다. 폐기/재발급이 필요하다.** 저장소에는 기록하지 않았다.
- 다음: ADR-0006 확정, 생성 모델 측정.

## 2026-09-09 — ADR-0005 Accepted and Chunking Measured

- 사용자가 ADR-0005의 세 결정을 그대로 채택해 Status를 Accepted로 올렸다.
- `poc/rag_eval.py`를 작성했다. 의존성 없이 표준 라이브러리만 쓰며 `chunks` / `selftest` / `search` 세 명령을 가진다.
- 청킹 측정을 실행했다. 섹션 = 청크는 46청크(200자 미만 11개), 짧은 섹션 병합은 35청크(최소 205 / 중앙 367 / 최대 821자)였다.
- **가장 긴 섹션이 647자로, 길이 때문에 섹션을 분할할 일은 없었다.** 기존에 기록한 "섹션이 길어 쪼개야 한다"는 방향은 이 규모에서 틀렸고, 실제 문제는 짧은 섹션이었다.
- 병합 청크 9개가 두 개 이상 섹션에 걸쳐 `document_chunk.section_title`을 `section_titles text[]`로 수정했다.
- selftest가 관리자 필드 제외, 추천 질문 블록 제거, 비공개 문서 검색 제외를 assert로 확인한다. 작성 중 front matter 파서 버그와 청크 병합의 선두 섹션 예외를 잡아 수정했다.
- 검증: `selftest`와 `chunks` 실행 결과다. **`search`는 OPENAI_API_KEY가 없어 실행하지 못했고 한국어 검색 품질은 미측정이다.**
- 다음: 키를 넣고 `search` 실행 후 임베딩 모델과 `vector(n)` 차원을 ADR로 확정.

## 2026-09-09 — ERD Draft

- `samples/`의 실제 콘텐츠를 기준으로 DATA_MODEL에 ERD 초안을 작성했다. Business Data 11개 + Document Layer 3개 + Chat 3개 테이블이다.
- 샘플에서 식별한 공백 8건을 모두 스키마에 반영하고 처리 방식을 표로 남겼다.
- Postgres 작성 규칙을 적용했다: `bigint generated always as identity` PK, `text`/`timestamptz`, 소문자 snake_case, FK 인덱스, 공개 목록용 부분 인덱스, HNSW 벡터 인덱스.
- 두지 않기로 한 테이블 5개와 이유를 기록했다. `admin_user`는 허용 계정이 하나라 설정값으로 대체한다.
- ADR 대상 결정 3건을 ADR-0005에 **Proposed**로 분리했다. 사용자 확정 전이므로 Accepted로 올리지 않았다.
- GRAPH_DESIGN에 Skill/Category가 Document가 아니라는 점과 Graph 전용 Edge가 필요하다는 점을 반영했다.
- 검증: 문서 간 정책 대조만 수행했다. DB가 없어 DDL 실행, 제약 동작, 인덱스 계획은 미검증이다.
- 다음: ADR-0005 확정 후 최소 RAG PoC.

## 2026-09-09 — Sample Content Prepared

- 사용자가 제공한 대표 프로젝트 3건(비오라 / 유진로봇 / 싱크마스터)을 CONTENT_SPEC 형식으로 `samples/projects/`에 저장했다. 원문의 서술 지침·검토 메모는 본문에서 분리해 front matter의 `open_questions`로 옮겼다.
- 프로젝트에서 파생한 블로그 3편을 `samples/blog/`에 작성했다. AI 초안이며 `sample: true`로 표시했다. 프로젝트 서술 범위를 넘는 사실이나 수치를 만들지 않았다.
- `blog/offline-first-boundary.md`는 RAG-007(공개 범위 필터) 검증을 위해 비공개로 두고, 공개 글이 Relation으로 참조하도록 구성했다.
- 추천 질문 블록 문법은 `:::questions` 컨테이너를 후보로 채택했다. CONTENT_SPEC의 미정 항목이며 확정 아님.
- 샘플 적용 결과 데이터 모델 공백 8건을 식별해 `samples/README.md`에 기록했다. CURRENT_STATE와 NEXT_ACTIONS를 동기화하고 CURRENT_PLAN의 샘플 데이터 항목을 완료 처리했다.
- 검증: 문서 대조와 파일 구성 확인만 수행했다. 색인/검색/실행 테스트는 구현이 없어 수행하지 않았다.
- 다음: 공백 8건을 반영한 ERD 초안 작성, 이어서 최소 RAG PoC.

## 2026-09-09 — Uncommitted Documents Organized

- 워킹 트리에만 있던 문서 변경을 주제별 커밋으로 정리했다: 배포/비용(ADR-0003, ADR-0002, AWS_COST_PROPOSAL, ARCHITECTURE), RAG 정책/콘텐츠 스펙(ADR-0004, RAG_DESIGN, RAG_TEST_CASES, CONTENT_SPEC, REQUIREMENTS, DATA_MODEL), 세션 인계 문서.
- `.DS_Store` 추적을 해제하고 `.gitignore`를 추가했다.
- 문서 내용 변경은 없다. 기존 결정/미확정 상태를 그대로 커밋했다.
- 다음: NEXT_ACTIONS의 Priority 1~2(RAG 모델 채택, 샘플 콘텐츠 기반 데이터 모델 검증)를 진행한다.

## 2026-09-09 — Content Follow-up Decisions

- 사용자 답변 4개를 반영했다: 상태 배지 미노출, 추천 질문 새 세션 즉시 전송, Blog 섹션형 Markdown/추천 질문 지원, Profile 짧은 소개글 분리.
- CONTENT_SPEC, REQUIREMENTS, DATA_MODEL, CURRENT_STATE, NEXT_ACTIONS, SESSION_LOG를 동기화했다.
- 문서 대조 및 diff 공백 검사만 수행했다. 실행 기능은 미구현이다.
- 다음: 이 요구사항으로 데이터 사전/ERD를 작성하고 추천 질문 원문 맥락 전달 등 구현 세부를 정의한다.

## 2026-09-09 — Content Fields and Presentation Refined

- 사용자 텍스트와 첨부 이미지의 표시 구조를 바탕으로 CONTENT_SPEC을 작성했다.
- Project 기본/대표·비대표 목록/상세 섹션, 공통 Skill 관리, Blog 메타정보, Profile 소개 섹션/스킬 그룹을 정리했다.
- 이미지의 예시 기술 선택/경력 내용은 결정이나 실제 데이터로 취급하지 않았다. 미언급 기존 기능과 추천 질문 동작 등은 확인 대상으로 남겼다.
- 변경: CONTENT_SPEC.md, REQUIREMENTS.md, DATA_MODEL.md, CURRENT_STATE.md, NEXT_ACTIONS.md, SESSION_LOG.md.
- 검증: 요청 항목과 문서 대조 및 diff 공백 검사. 코드/DB 구현과 실행 테스트는 수행하지 않았다.
- 다음: 확인 항목 해소 후 데이터 사전/ERD 초안 작성.

## 2026-09-09 — RAG Implementation Recommendation Explained

- OpenAI 모델 및 Spring AI ChatClient/PGvector/Chat Memory 공식 문서를 조회했다.
- RAG_DESIGN에 초기 조합 후보와 라이브러리/애플리케이션 책임, 세션 맥락 비용 조건을 기록했다. CURRENT_STATE/NEXT_ACTIONS도 동기화했다.
- 새 Accepted 결정이나 구현 없음. 실제 품질/버전 호환성은 미검증이며 문서 변경만 검증했다.
- 다음: 추천안 채택 후 실제 콘텐츠 기반 PoC 기준 확정.

## 2026-09-09 — RAG Grounding and Session Memory Confirmed

- 공개 콘텐츠만 사용, 출처 표시, 근거 부족 명시와 세션별 대화 기억을 ADR-0004에 Accepted로 기록했다.
- Requirements, RAG Design, Data Model, RAG Test Cases 및 세션 인계 문서를 동기화했다.
- 후속 질문/세션 분리/비공개 제외/이력 오정보/타인 접근/원문 발행 취소 평가 사례를 Planned로 추가했다.
- 검증: 문서 정책 대조 및 diff 공백 검사. 실행 가능한 앱은 없으므로 실제 동작 테스트는 수행하지 않았다.
- 다음: 생성/임베딩 모델과 세션 보관·복원·컨텍스트 상한 설계. 저장 기술은 미확정이다.

## 2026-09-09 — Initial Deployment Selected

- 사용자 추천안 채택에 따라 Vercel Hobby + 서울 Lightsail 2GB + RDS micro 구성을 ADR-0003에 Accepted로 기록했다.
- Architecture, 비용 제안서 상태, Current State, Next Actions를 동기화했다. 모델 후보는 자동 확정하지 않았다.
- 검증: 문서 상태 대조 및 diff 공백 검사. 실제 배포/성능/청구금액은 미검증이다.
- 다음: RAG 모델/평가 기준, 데이터·발행 정책, API·인증 상세 설계.

## 2026-09-09 — RDS Retained and Compute Options Compared

- 사용자 결정으로 RDS 유지 확정. ADR-0002와 Architecture/Current State/Next Actions에 반영했다.
- AWS 서울 EC2 공식 가격표를 조회해 Lightsail 2GB와 EC2 t4g/t3a/t3 small을 비교했다. EBS 20GB/IPv4를 포함한 총예산은 각각 약 7.1만/8.5만/8.8만/9.1만 원이다.
- 비용 제안서에 단가/SKU, 가정, VPC/IAM/ARM 및 CPU 버스트 차이를 기록했다. Decimal 산술 확인, 실제 배포·성능 미검증.
- 변경: ADR-0002, ARCHITECTURE.md, AWS_COST_PROPOSAL.md, CURRENT_STATE.md, NEXT_ACTIONS.md, SESSION_LOG.md.
- 다음: 앱 서버 선택 후 상세 배포 구성 확정. 서버/Vercel 선택은 이번 비교로 자동 확정하지 않는다.

## 2026-09-09 — Database Cost Reduction Tradeoffs

- 서울 RDS 가격표의 Single-AZ PostgreSQL 최저 시간당 단가와 공식 최소 저장 공간/인스턴스 사양을 대조했다.
- Vercel + Lightsail 앱/DB 통합 4GB 약 56,100원, 2GB 약 36,300원을 계산했다. 메모리 경쟁, 백업/복구, 보안 업데이트 및 동시 장애 부담을 문서화했다.
- 변경: AWS_COST_PROPOSAL.md, CURRENT_STATE.md, NEXT_ACTIONS.md, SESSION_LOG.md. 공식 자료/산술 검증만 수행했으며 배포·성능은 미검증이다. 관리형 DB 선호 변경이나 새 기술 확정 없음.
- 다음: 비용 절감과 DB 직접 운영 책임 중 사용자 선호를 반영해 구성 채택.

## 2026-09-09 — Vercel Hybrid Cost Comparison

- Vercel 공식 Hobby/한도/이용 조건과 Lightsail 단가를 확인했다.
- Next.js/React는 Vercel, Spring Boot는 Lightsail 2GB로 분리하는 월 약 70,736원 후보를 비용 제안서와 현재 상태/다음 작업에 반영했다.
- 기존 2GB 통합안과 비용은 같고 백엔드 메모리 여유를 얻는다는 차이를 명시했다. 1GB 후보는 약 62,486원이지만 성능 미검증이다.
- 변경 파일: AWS_COST_PROPOSAL.md, CURRENT_STATE.md, NEXT_ACTIONS.md, SESSION_LOG.md. 공식 문서 및 산술 검토만 수행했고 새 Accepted 결정/배포는 없다.
- 다음 작업: 후보 채택 후 상세 배포/인증 도메인 설계와 부하 검증.

## 2026-09-09 — AWS Monthly Cost Proposal

### Completed
- AWS 공식 서울 RDS 가격표, Lightsail/피어링/pgvector 자료 및 OpenAI 공식 모델 단가를 확인했다.
- 전체 비용 포함 약 90,536원 추천안을 `AWS_COST_PROPOSAL.md`에 Proposed로 기록했다. 환율 1,500원, 730시간, 세금 여유 10%, 소규모 사용량 가정이다.
- 2GB 앱 서버 절약안과 RDS small 증설 비용, 환율 민감도 및 사용 제한 후보를 비교했다.

### Changed Files
- `docs/02-design/AWS_COST_PROPOSAL.md`
- `docs/05-session/CURRENT_STATE.md`
- `docs/05-session/NEXT_ACTIONS.md`
- `docs/05-session/SESSION_LOG.md`

### Decisions / Validation
- 사용자 채택 전 추천안이며 새 Accepted 결정은 없다. 배포/결제 작업 없음.
- 공식 가격표의 SKU/단가를 확인하고 Decimal 계산으로 월 합계와 환율 시나리오를 검증했다.
- 성능, 실제 사용량 및 청구금액은 미검증이다.

### Next
- 추천안 채택 후 상세 배포 설계 및 RAG PoC.

## 2026-09-09 — Operating Conditions Confirmed

### Completed / Decisions
- 모든 비용을 포함한 월 100,000원 예산으로 변경했다.
- AWS 및 AWS 관리형 DB 선호, GitHub 본인 계정만 관리자 로그인 허용, 설정으로 해제 가능한 챗봇 질문 제한을 ADR-0002에 기록했다.
- 구체 AWS 서비스, 계정 식별자, 제한 수치와 집계 방식은 미확정이다.

### Changed Files
- `docs/03-decisions/ADR-0001-core-technology-stack.md`
- `docs/03-decisions/ADR-0002-operating-budget-auth-and-limits.md`
- `docs/00-project/PROJECT_OVERVIEW.md`
- `docs/00-project/REQUIREMENTS.md`
- `docs/02-design/ARCHITECTURE.md`
- `docs/05-session/CURRENT_STATE.md`
- `docs/05-session/NEXT_ACTIONS.md`
- `docs/05-session/SESSION_LOG.md`

### Validation
- 현재 기준 문서의 예산·인증·운영 조건을 대조했다. 과거 세션 기록의 당시 예산은 이력으로 유지한다.
- 문서만 변경했으며 실제 인증/제한 기능 구현, 가격 및 예산 충족 검증은 수행하지 않았다.

### Next
- 확정 조건에 맞는 AWS 배포 구성과 비용을 검토하고, 모델/인증 세션/제한 상세 정책을 설계한다.

## 2026-09-09 — Core Stack and Development Goals Confirmed

### Completed / Decisions
- 사용자 지정 핵심 스택을 Accepted ADR-0001에 기록했다.
- RAG 중심의 구현 목표, 프론트엔드·백엔드·AI 전체를 다루는 콘텐츠 목표, 백엔드 학습 목적과 월 50,000원 예산을 기록했다.
- 예산 포함 범위, 배포/인증, 생성/Embedding 모델 등은 미확정으로 유지했다.

### Changed Files
- `docs/03-decisions/ADR-0001-core-technology-stack.md`
- `docs/00-project/PROJECT_OVERVIEW.md`
- `docs/02-design/ARCHITECTURE.md`
- `docs/04-plans/CURRENT_PLAN.md`
- `docs/05-session/CURRENT_STATE.md`
- `docs/05-session/NEXT_ACTIONS.md`
- `docs/05-session/SESSION_LOG.md`

### Validation
- 사용자 결정과 관련 문서의 확정/미확정 항목을 대조했다. 문서 변경만 수행했다.
- 가격, 버전 호환성, 예산 충족 여부 및 런타임은 미검증이다.

### Next
- 예산 포함 범위, 배포 선호/DB 운영 방식, Admin 로그인 선호 확인 후 후속 설계.

## 2026-09-09 — Full MVP Scope Confirmed

### Completed / Decisions
- 사용자 요청에 따라 REQUIREMENTS의 전체 기능을 MVP에 포함하도록 확정했다.
- Graph View, Relation 관리/확장, RAG Playground를 1차 배포에 포함한다.
- 기존 Out of Scope는 유지하며 별도 Backlog 후보는 자동 확정하지 않는다.
- 기술 스택이나 상세 정책은 이번 결정에 포함하지 않았다.

### Changed Files
- `docs/00-project/REQUIREMENTS.md`
- `docs/04-plans/CURRENT_PLAN.md`
- `docs/05-session/CURRENT_STATE.md`
- `docs/05-session/NEXT_ACTIONS.md`
- `docs/05-session/SESSION_LOG.md`

### Validation
- 요구사항, 현재 계획 및 인계 문서의 MVP 상태를 대조했다.
- 문서 변경만 수행했으며 애플리케이션 테스트는 해당하지 않는다.

### Next
- 전체 MVP에 맞춘 기술 스택 결정과 기능별 상세 정책/수용 기준 정의.

## 2026-09-09 — Project Analysis

### Goal
프로젝트 목적, 현재 구현 상태, 설계 방향과 구현 전 공백을 분석한다.

### Completed
- 프로젝트 정의, 요구사항, 전체 설계, 계획, ADR 현황 및 테스트 문서를 저장소 파일 목록과 대조했다.
- 원본 Business Data와 재생성 가능한 RAG Document Layer의 분리, Graph/RAG의 Relation 공유 방향을 확인했다.
- 공개 범위 필터링, 삭제/발행 취소 동기화, 재색인 실패 복구, Relation 식별자/방향/중복 정책의 상세 정의가 필요함을 확인했다.
- Graph Skill/Category 노드 후보에 대응하는 Document type 매핑이 미정임을 확인했다.

### Changed Files
- `docs/05-session/SESSION_LOG.md`
- `docs/05-session/CURRENT_STATE.md`
- `docs/05-session/NEXT_ACTIONS.md`

### Decisions
- 새 기술 또는 제품 범위 결정 없음. 검토 항목을 미확정 상태로 기록했다.

### Validation
- 파일 목록 기준 애플리케이션 코드와 실행 가능한 테스트가 없고, ADR 디렉터리에는 안내 문서만 있음을 확인했다.
- 요구사항/설계/계획/테스트 문서 정적 검토. 빌드, 런타임, 검색 품질 및 성능 검증은 구현 부재로 수행하지 않았다.

### Next
- NEXT_ACTIONS의 기존 우선순위에 따라 MVP를 확정하고, 샘플 콘텐츠로 설계 공백을 해소한다.

## 2026-09-09 — Initial Documentation Bootstrap

### Goal
Codex와 Claude Code가 동일한 프로젝트 규칙과 상태를 공유하며 새 세션에서도 이어서 개발할 수 있는 문서 체계를 생성한다.

### Completed
- 프로젝트 정의 문서 작성
- 요구사항 초안 작성
- 전체 Roadmap 작성
- Codex / Claude 공통 규칙 체계 작성
- Architecture / Data / RAG / Graph / API 설계 초안 생성
- ADR 구조 생성
- Current Plan / Backlog 생성
- Current State / Next Actions / Session Log 생성
- 테스트/QA 문서 템플릿 생성

### Decisions
- `docs/`를 SSOT로 사용한다.
- `AGENTS.md`와 `CLAUDE.md`는 별도 정책을 갖지 않고 공통 `docs/01-rules/`를 참조한다.
- 세션 연속성은 `CURRENT_STATE.md`, `NEXT_ACTIONS.md`, `SESSION_LOG.md`를 중심으로 관리한다.

### Validation
- 초기 문서 구조 생성 완료.
- 애플리케이션 구현은 아직 시작하지 않았다.

### Next
- MVP 범위 확정
- 기술 스택 비교 및 ADR 작성
- 실제 샘플 데이터를 이용한 데이터 모델 검증

## 2026-09-16 — 작업 재개 및 인계 상태 정합성 복구

- 기존 ERD와 ADR-0005~0007 Accepted, RAG PoC 구현을 확인했다. 중복 설계는 추가하지 않았다.
- CURRENT_STATE의 미시작/모델 후보/이전 완료 기준을 수정하고 NEXT_ACTIONS를 기존 CURRENT_PLAN·ARCHITECTURE의 구현 전 결정 2건에 맞췄다.
- 기존 미커밋 ARCHITECTURE와 CURRENT_PLAN 변경은 보존했다. 새 기술 결정이나 제품 구현은 수행하지 않았다.
- 검증: ADR 상태와 문서 참조 대조, git diff --check. API 유료 재평가와 DB 실행 검증은 하지 않았다.
- 다음: 빌드 도구/버전 호환성 및 API Style 결정안 작성 후 첫 구현 계획 구체화.

## 2026-09-16 — Spring AI 채택

- 사용자 결정: Java 21 유지, 학습 목적으로 Spring AI 사용. ADR-0001과 세션 문서에 반영했다.
- Boot 3.5.x / AI 1.1.x의 공식 지원 관계를 확인했다. 패치 버전 고정과 실제 빌드·DB 검증은 남아 있다.
- API 방식은 REST/JSON 및 채팅 SSE를 설명하는 단계이며 확정으로 처리하지 않았다.
- 검증: 공식 문서 대조 및 git diff --check. 제품 코드는 변경하지 않았다.

## 2026-09-16 — API 방식 확정

- 사용자 채택: REST + JSON, 채팅 진행 상태·공개 문서 목록·답변의 SSE 전달.
- ADR-0008을 Accepted로 작성하고 API_DESIGN, ARCHITECTURE, CURRENT_PLAN 및 세션 상태/다음 작업을 동기화했다.
- 검색 문서와 최종 인용 출처의 구분, 비공개 문서 메타정보 미노출을 기록했다.
- 검증: 문서 참조 및 git diff --check. 런타임 스트리밍 검증은 구현 후 수행한다.
- 다음: Java 21/Spring AI 기준 빌드 도구·버전 검증과 첫 구현 계획.

## 2026-09-16 — 백엔드 호환성 검증 및 첫 구현 계획

- Maven Central에서 AI 1.1.8 배포를 확인하고 Java 21/Maven 3.9.11/Boot 3.5.16/QueryDSL 5.1.0 조합을 실제 컴파일했다. BUILD SUCCESS와 QArticle 생성·참조를 확인했다.
- 임시 PostgreSQL 17.10/pgvector 0.8.2에 DATA_MODEL SQL 10블록을 적용해 20테이블 및 HNSW 생성을 확인했다. 검증 컨테이너는 종료·삭제했다.
- ADR-0009, poc/java-compat 재현 프로젝트, FIRST_BACKEND_IMPLEMENTATION을 추가했다. 아키텍처/계획/인계 문서를 갱신했다.
- Spring AI 기본 스키마를 기존 document_chunk와 동일시하지 않도록 기록했다. 실제 AI 호출과 RDS 배포는 수행하지 않았다.
- 다음: 계획 Task 1 서버 기동·Flyway부터 실행. 변경은 기능 단위로 나눠 커밋한다.

## 2026-09-16 — Initializr backend 의존성 설정

- 사용자 생성 Boot 4.1.1/Gradle Groovy Wrapper 9.7.1/AI 2.0.1 프로젝트를 유지했다. 패키지는 dev.portfolio.portfolio_api.
- Swagger springdoc 3.1.1 및 QueryDSL 5.1.0 Jakarta runtime/annotation processor를 추가했다. 테스트 processor는 본 설정을 상속한다.
- QuerydslSetupTest로 생성 Q 타입 참조와 조건식 구성을 검증했다. `clean test --tests '*QuerydslSetupTest' bootJar` BUILD SUCCESSFUL, 테스트 1건 성공. git diff --check 통과.
- 기존 contextLoads는 DB·AI 설정 전이므로 실행하지 않았다. 테스트를 삭제하거나 비활성화하지 않았다. 실제 JPA 조회 및 Swagger HTTP 접근은 후속 검증이다.
- ADR-0009, 아키텍처, 첫 구현 계획, 세션 상태와 backend README를 현재 생성 프로젝트 기준으로 갱신했다.

## 2026-09-16 — 첫 백엔드 Task 1 검증 기록 및 커밋 정리

- 진행 상황을 분석하다가 문서와 코드가 어긋난 것을 발견했다. 문서에는 "contextLoads 미실행, DB 설정 없음"으로 적혀 있었으나, backend/에는 이미 Flyway V1, local 프로필, compose.yaml, 스키마 검증 테스트가 있었다. 11:38 KST 사용자 로컬 실행 보고서에서도 테스트 2건이 성공했다.
- 검증(이번 세션): 테스트 보고서 XML과 로그(PostgreSQL 17.10, V1 적용, 재검증 성공, 컨텍스트 기동)를 확인했다. 주석을 빼고 공백을 정규화해 V1과 DATA_MODEL SQL 10블록을 대조했더니 같았다(extension 1줄 추가). `.env`가 git에서 제외되고 `.env.example`만 추적되는지도 확인했다.
- 이번 세션 환경(사용자 PC의 Cowork VM)에는 Docker와 Java 21이 없어 테스트를 재실행하지 못했다. 위 결과는 사용자 로컬 실행 보고서에 근거한다.
- 문서 동기화: FIRST_BACKEND_IMPLEMENTATION Task 1에 체크하고 계획과 달라진 구현(application.properties, 기존 테스트 클래스 활용)을 적었다. ADR-0009에 DB 검증 절을 추가하고, ADR-0001의 Boot 3.5 문장에는 후속 안내를 달았다. backend/README, CURRENT_PLAN, CURRENT_STATE, NEXT_ACTIONS도 갱신했다.
- 커밋: 이전 세션부터 미커밋이던 설계 문서(ADR-0008/0009, API_DESIGN, ARCHITECTURE, 계획)와 backend/, 세션 문서를 나눠 커밋했다.
- 참고: Cowork VM에서 git status를 실행하다 `.git/index.lock`이 남았고, 사용자 승인을 받아 삭제했다.
- 미해결: 이전 PoC에서 노출된 OpenAI API 키의 폐기 여부는 아직 확인하지 못했다. Task 2 진행 전 Spring Security 기본 차단에 주의한다.

## 2026-09-16 — 첫 백엔드 Task 2: GET /api/skills

- 구현: `skill/Skill`(엔티티), `SkillResponse`(record), `SkillController`(QueryDSL, code 오름차순, 읽기 전용 트랜잭션), `config/QuerydslConfig`, 임시 `config/SecurityConfig`, `SkillApiTest` 4건.
- 계획과 다른 점: 패키지를 `dev.portfolio.skill`에서 `dev.portfolio.portfolio_api.skill`로 바꿨다. 앱의 컴포넌트·엔티티 스캔 범위 밖이기 때문이다. Spring Security가 기본으로 모든 요청을 막아서, 이 경로만 익명 허용하는 최소 설정을 추가했다(인증 정책 결정 아님).
- 검증: 사용자 로컬(13:21 KST)에서 `./gradlew clean test bootJar` BUILD SUCCESSFUL, 6건 모두 성공. 테스트 보고서 XML로 확인했다. 테스트와 구현을 함께 작성해 구현 전 404 실패 단계는 관찰하지 못했다.
- 실행 환경 제약: Cowork VM과 클라우드 작업 공간 모두 Maven Central·Docker Hub에 접근할 수 없어 직접 빌드하지 못했다. 컴퓨터 사용은 터미널 입력이 허용되지 않고, Finder 백그라운드 조작도 실패해 사용자가 직접 실행했다. 사용자 Mac에는 `docker compose`(v2)가 없어 이미 떠 있던 DB로 실행했다.
- 문서: API_DESIGN(Implemented Endpoints), 구현 계획 Task 2 체크, CURRENT_PLAN, CURRENT_STATE, NEXT_ACTIONS, backend/README.
- 다음: 프로젝트/블로그/프로필 공개 조회 API 구현 계획 작성.

## 2026-09-16 — 공개 조회 API와 개발용 Swagger

- 사용자 결정: 개발 시 Swagger 공개, Docker 유지, OpenAI API 키는 기존 키 사용.
- 계획: `docs/04-plans/PUBLIC_READ_API_IMPLEMENTATION.md` 작성 후 구현.
- 구현: 프로젝트(대표/비대표 구분 목록, 상세), 블로그(페이지·카테고리·태그 필터, 상세), 프로필(경력, 스킬 그룹, 섹션), 공용 섹션 조회. local 프로필에서만 Swagger를 켜고 익명 허용. `spring.mvc.problemdetails.enabled=true`.
- 검증: 사용자 로컬 실행(13:46 KST)으로 18건 모두 통과. 비공개 샘플 글(offline-first-boundary 상황)이 목록·필터·상세에 나오지 않음을 확인했다. 테스트와 구현을 함께 작성해 실패 단계는 관찰하지 못했다.
- 미룬 것: Relation 표시(Document 색인 필요), 시드 데이터, Admin CRUD.
- 문서: API_DESIGN 계약, 계획 문서 결과, CURRENT_PLAN, CURRENT_STATE, NEXT_ACTIONS, backend/README.
- 다음: 관리자 인증 결정 확인 → Admin 인증 + CRUD 계획.

## 2026-09-16 — 관리자 인증(ADR-0010)과 Skill 관리

- 사용자 결정: 허용 계정 GitHub `sonic0506`, 세션은 추천안(서버 세션 쿠키), Admin 도메인 미정. ADR-0010 작성.
- 구현: GitHub OAuth 로그인, 허용 판정(숫자 ID 우선, 실제 로그인으로 `159202139` 확인해 기본값 설정), `/api/admin/me`, 로그아웃, 쿠키 CSRF, `/api/**` 401, CORS 설정값(기본 꺼짐), Skill 관리 API, DevTools.
- 발견·수정한 문제: 다른 계정 로그인 시 무한 리다이렉트 루프(실패 시 403으로 수정, 회귀 테스트 추가), 로그아웃 200→204, 삭제 flush 누락, csrf() 테스트 도구가 공유 CSRF 저장소를 바꾸는 문제(`CsrfCookieTest` 분리), 다른 패키지 테스트 헬퍼 접근 오류(`ApiTestSupport.admin()`으로 이동).
- 검증: 사용자 로컬 34건 통과(14:39 KST). 수동: 본인 로그인 성공, 다른 계정 403.
- 문서: ADR-0010, ARCHITECTURE, API_DESIGN(Admin API), ADMIN_AUTH_IMPLEMENTATION, CURRENT_PLAN, CURRENT_STATE, NEXT_ACTIONS, backend/README.
- 다음: Project/Blog/Profile 관리 CRUD 계획.

## 2026-09-16 — 콘텐츠 관리 CRUD 1단계 (Project, Category/Tag)

- 계획: `ADMIN_CONTENT_CRUD_IMPLEMENTATION.md`. 범위가 커서 2단계로 나눴다(1단계 Project·Category/Tag, 2단계 Blog·Profile).
- 규칙: 관리 대상은 id로 지정, PUT 전체 교체(하위 목록 순서 = 표시 순서), 첫 공개 시 발행일 기록·공개 해제 후 유지, updated_at 갱신.
- 구현: 공용 `SectionWriter`, Project 관리(목록·상세·생성·수정·삭제), Category/Tag 관리. `project.updated_at` 쓰기 가능 매핑.
- 검증: 사용자 로컬 44건 통과(15:03 KST). 첫 실행에 통과했다.
- 미룬 것: 발행 토글과 `document.visible` 동기화(색인 단계), Blog·Profile 관리(2단계).
- 문서: API_DESIGN(콘텐츠 관리), 계획 문서, CURRENT_PLAN, CURRENT_STATE, NEXT_ACTIONS.

## 2026-09-16 — 콘텐츠 관리 CRUD 2단계 (Blog, Profile)

- 구현: Blog 관리(카테고리·태그·기술·섹션 전체 교체, 발행일 규칙 동일), Profile 단일 행 upsert(경력·스킬 그룹·섹션), 공용 참조 ID 검사 `IdChecks`.
- 검증: 사용자 로컬 52건 통과(15:21 KST). 첫 실행에 통과했다.
- 문서: API_DESIGN(Blog·Profile 관리), 계획 문서 완료, CURRENT_PLAN, CURRENT_STATE, NEXT_ACTIONS.
- 다음: 샘플 콘텐츠 시드 → Document 색인 계획.

## 2026-09-16 — 샘플 시드와 테스트 DB 분리

- 사용자 프로필 초안 수신 → `samples/profile-draft.md` 원문 보관, 사용자 선택으로 `samples/profile.md` 작성. 기존 샘플 프로젝트 3건은 프리랜서 프로젝트라는 답변.
- local 전용 시드(`app.seed.samples-dir`) 구현, `samples/taxonomy.md`·`skills.md` 보강.
- 발견·수정: viora YAML 오류, CASE 파라미터 타입 추론, JPA 캐시 stale, 테스트·개발 DB 공유 → `portfolio_test` 분리(사용자가 최초 1회 DB 생성).
- 검증: 사용자 로컬 54건 통과(16:17 KST), 테스트 DB 사용 확인.
- 확인 대기: 프로필 사실 충돌 5건(SAMPLE_SEED_IMPLEMENTATION).
- 다음: Document 색인 계획.

## 2026-09-16 — Document 색인

- 계획: `DOCUMENT_INDEX_IMPLEMENTATION.md`. 구현 전 PoC 청킹에 DB 섹션 형태 본문을 넣어 35청크 일치를 먼저 확인했다.
- 구현: `rag` 패키지(DocumentProjector, Chunker, EmbeddingClient/SpringAiEmbeddingClient, DocumentIndexer, 커밋 후 비동기 색인, 관리 API), 관리 서비스에 투영 연결, 시드 Relation, 임베딩 설정(기본 꺼짐).
- 검증: 사용자 로컬 68건 통과(16:44 KST). 샘플 청킹이 PoC 측정과 일치.
- 발견·수정: 편집 스크립트가 다른 메서드의 선언까지 삭제(컴파일 오류), 테스트 헬퍼 이름이 MockMvc `status()`를 가림.
- 미검증: 실제 OpenAI 임베딩 호출(사용자 확인 대기).
- 다음: 실제 임베딩 1회 → 검색·답변 계획.

## 2026-09-16 — 실제 임베딩 색인 확인

- 사용자가 local에서 `EMBEDDING_PROVIDER=openai`로 `reindex?rebuild=true` 실행, 7건 모두 READY 보고. Spring AI 2.0.1 OpenAI 임베딩 연동이 실제로 동작함.

## 2026-09-16 — 채팅 1차 (단일 질문 검색·답변·SSE)

- 사용자 결정: 단일 질문부터, 질문 제한 IP당 하루 20회(전체 300).
- 계획 `CHAT_IMPLEMENTATION.md`. 구현: Retriever(pgvector, 공개만, Relation 확장), ChatService, SpringAiChatGenerator, SSE ChatController, ChatRateLimiter, SecurityConfig(익명·CSRF 제외).
- 발견·수정: 생성자 2개로 인한 컨텍스트 로드 실패(`@Autowired`).
- 검증: 사용자 로컬 77건 통과(18:27 KST). 실제 생성 호출은 미검증.
- 문서: API_DESIGN(채팅 계약), RAG_DESIGN, ADR-0002 후속 결정, 계획, 세션 문서, backend/README.

## 2026-09-16 — 실제 채팅 검증

- 사용자가 브라우저 콘솔 스크립트로 `/api/chat`에 PoC 질문 7개 실행. 인용 출처 기준 기대 출처 7/7, OAuth 근거 부족 답변, 비공개 글 미노출. 응답 1.5~6.8초.
- 발견: 프로필 문서 slug가 비어 출처가 빈 문자열 → slug `profile` 고정, 테스트 추가.
- 개선 후보: "AI 프로젝트" 질문에 AI 도구 사용 사례가 함께 묶여 제시됨(콘텐츠·프롬프트).
- 문서: RAG_MEASUREMENTS 측정 4, RAG_TEST_CASES, 계획·세션 문서.

## 2026-09-16 — 프로필 slug 수정, 세션·프론트 방향

- 프로필 문서 slug `profile` 고정, 사용자 로컬 77건 통과.
- 사용자 결정: 포트폴리오 Next.js, 어드민 React. 채팅 세션은 localStorage로 유지하고 서버 보관은 하루.
- ADR-0011(Proposed): 위 결정 + Claude 제안(슬라이딩 24시간, 서버 발급 ID·비밀키 해시, 상한). 사용자 확인 대기.

## 2026-09-16 — ADR-0011/0012 확정, 채팅 세션, 미답변 질문 요청

- 사용자: ADR-0011 제안 채택, 어드민 Vite + pnpm(ADR-0012), 채팅 세션 먼저.
- 구현: ChatSessionService/Controller, ChatStreams, 이력 반영 ChatService, 인용 문서 삭제 허용. 사용자 로컬 89건 통과(첫 실행).
- 사용자 요청: 근거 부족 시 부드러운 안내 문구 + 답하지 못한 질문 보관·관리자 확인. 결정(표시+출처 없음 판정, 설정 템플릿, 90일 자동 삭제+관리자 삭제)을 UNANSWERED_QUESTIONS_IMPLEMENTATION에 기록.

## 2026-09-17 — 답하지 못한 질문 보관, FAQ 요청

- ADR-0013 작성, ADR-0007 후속 결정. V2 마이그레이션, NoAnswerMarker, 기록·관리자 API·90일 정리. 사용자 로컬 101건 통과(첫 실행).
- 사용자 요청: 고정 질문·답변 등록과 유사 질문 매칭 방식 논의.

## 2026-09-17 — FAQ

- 측정 5(거리 기준 불가) → ADR-0014(RAG 문서 + 모델 판단). V3, 관리자 API, 프롬프트 규칙. 사용자 로컬 107건 통과.
- 측정 6(실제 모델): 같은 뜻 3/3 등록 답변, 다른 뜻 2/2·근거 없음 1/1 안내 문구.

## 2026-09-17 — 프롬프트 다듬기와 재확인

- 안내 문구 주제를 명사구로 쓰는 규칙 추가. 측정 7(실제 모델) 10/10, 근거 있는 질문 오판정 없음.
- 프로필 출처 빈 slug 재발: 개발 DB 문서가 수정 전 투영 상태였음 → 조회 시 PROFILE이면 `profile`로 대체, 테스트 추가. 사용자 로컬 108건 통과, 화면 노출 확인.

## 2026-09-17 — 프론트엔드 1단계

- 사용자 선택: Tailwind + shadcn, TanStack Query + RHF + Zod, 개발 서버 프록시, Node 22.22 이상/24 → ADR-0012 후속 결정, FRONTEND_IMPLEMENTATION 작성.
- 루트 pnpm workspace, `frontend/portfolio`(Next.js 16.3.5: 홈·프로젝트·블로그·소개, Markdown `:::questions` → 채팅 질문, 채팅 위젯 세션·SSE), `frontend/admin`(Vite 8.3: 로그인 확인, 미답변 질문 처리 → FAQ 등록, FAQ CRUD, 색인 상태).
- shadcn 레지스트리가 작업 환경에서 차단(403)되어 컴포넌트를 같은 형식으로 직접 옮겼다.
- 검증(컨테이너): 설치·빌드·lint·테스트 9건, 가짜 백엔드로 페이지·404·SSE 스트리밍·브라우저 채팅·어드민 로그인 화면. 실제 백엔드 연동과 사용자 Mac 설치는 미검증.
- 사용자 Mac 첫 실행: 백엔드 주소 `127.0.0.1`로 변경(IPv6 연결 실패), `skills` 응답 타입 수정(객체 배열). 이후 조회 화면 정상, 루트 test·lint·build 통과. 채팅·어드민 수동 확인은 대기.
- 사용자 확인: 복원·FAQ 등록·색인 정상. 스트리밍이 한꺼번에 표시 → Next 개발 서버 gzip 버퍼링 재현, 백엔드 SSE에 no-transform 헤더. 로그인 복귀 URL 누락 → `.env` 추가. FAQ와 비슷한 질문에 안내 문구가 함께 나옴 → 사용자 선택으로 등록 답변만(ADR-0014 후속).
- 사용자 요청: 본인 IP는 질문 제한 제외 → `CHAT_LIMIT_EXEMPT_IPS`(제한·집계 제외), 로컬 `.env`에 `127.0.0.1` 설정. 배포 시 실제 방문자 IP 판별은 후속.
- FAQ 비슷한 질문 답변이 실행마다 달라지고 판단 과정이 노출됨 → 사용자 선택으로 FAQ 판정 단계 분리(`FaqMatcher`, 일치 시 등록 답변 그대로), 답변 프롬프트에 판단 과정 금지 규칙. 컴파일·테스트는 사용자 로컬 대기(작업 환경에서 Gradle 다운로드 차단).
- 사용자 확인: 백엔드 111건 통과, 로딩 표시 확인. 로그인 버튼 이동 중 잠금 추가. 근거 번호 [n]은 화면에서 제거(사용자 선택, 출처 목록 유지). 포트폴리오 테스트 6건.
- 사용자 최종 확인: 로그인 버튼 잠금, 근거 번호 제거, FAQ 판정 일관성(질문별 반복), 질문 제한 제외 모두 정상. 프론트 1단계 완료.

## 2026-09-17 — 프론트 2단계: 어드민 콘텐츠 관리

- 프로젝트·블로그·프로필 편집 화면, 기술·카테고리·태그 관리 화면. 공용 폼 부품(섹션 편집, 항목 선택, 저장 바), 스키마·변환 테스트.
- 검증(컨테이너): 빌드·lint·테스트 13건, 가짜 백엔드 브라우저 확인. 실제 백엔드 확인은 사용자 대기.
- 사용자 확인: 실제 백엔드로 콘텐츠 관리 전체와 409 안내, test·lint·build 정상. 2단계 완료.

## 2026-09-17 — 참고 문서 (프로젝트·블로그 연결)

- 사용자 요청: 프로젝트·블로그에 참고 문서를 등록하고, 상세에서 참고 문서와 나를 참고한 문서를 보여준다.
- 사용자 결정: 연결 종류는 하나(A, `RELATED_TO`를 "참고"로 정의), 대상은 프로젝트·블로그만, 비공개는 제외 → ADR-0005 후속 결정, DATA_MODEL, CONTENT_SPEC, API_DESIGN, 계획 REFERENCE_DOCUMENTS_IMPLEMENTATION.
- 백엔드: `content/DocumentReferences`(검증: 중복·자기 자신·없는 대상 400, 나가는 연결 전체 교체, 관리/공개 조회), 프로젝트·블로그 관리 요청 `references`, 관리 상세 `references`/`referencedBy`, 공개 상세 `references`/`referencedBy`. 시드는 방향 그대로 저장(`on conflict do nothing`).
- 샘플: 블로그 쪽에 중복으로 적힌 역방향 연결을 제거(관계 4건 유지, web-serial-usb→offline-first-boundary 방향 확정). samples/README에 뜻 추가.
- 테스트: `ReferenceDocumentsApiTest` 5건 추가, 기존 관리 요청 본문에 `references` 추가, SampleIndexTest 방향 확인 추가.
- 어드민: `ReferencePicker`(프로젝트·블로그 후보 검색, 비공개 표시, 자기 자신 제외), `ReferencedByList`, 저장·삭제 후 다른 상세 캐시 무효화. 테스트 2건 추가, 스키마 테스트 갱신.
- 포트폴리오: 상세 하단 `References`(두 목록, 빈 목록 숨김). 테스트 2건 추가.
- 검증: 작업 환경에서 Gradle 배포판·Maven 다운로드 차단(403)으로 백엔드 컴파일·테스트 미실행. 프론트는 admin·portfolio `tsc --noEmit` 통과, portfolio eslint 통과. vitest·oxlint·vite build는 Mac용 네이티브 바이너리라 실행 불가 → 사용자 로컬 검증 필요(NEXT_ACTIONS Priority 0).
- 사용자 Mac 첫 실행: 포트폴리오 `references.test.tsx` 실패(vitest globals 꺼짐으로 Testing Library 자동 정리 안 됨) → `afterEach(cleanup)` 추가.
- 사용자 확인: 백엔드 116건 통과, 프론트 test·lint·build 통과, 어드민·포트폴리오 화면 정상. 참고 문서 기능 완료. 개발 DB 시드 재실행은 미확인(선택).

## 2026-09-28 — 실제 콘텐츠(Notion 위키) 반영

- 사용자 요청: Notion 위키(프로젝트 README + decisions 블로그)를 데이터로 반영, README의 `결정사항 / 트러블슈팅` 섹션은 제외. 변환안을 먼저 확인받음.
- 사용자 결정: 실제 데이터는 새 `content/`에 두고 `samples/`는 테스트·RAG 측정용으로 유지, 개발 DB의 기존 샘플은 삭제, 블로그 날짜는 2026-09-28, `fsd-notes.md` 제외, featured는 viora·bring-and-t·evar.
- `content/`: 프로젝트 7건, 블로그 12편, 참고 관계 15건, Skill 11개·카테고리 4개·태그 25개 추가. 변환 규칙은 `content/README.md`. 변환 스크립트는 일회성이라 저장소에 두지 않았다.
- 시드: 블로그 front matter `open_questions`도 관리자 메모에 넣도록 한 줄 추가.
- 테스트: `SampleSeederTest.seedsRealContent`(7/12/15건, featured 3, evar에 결정사항 섹션 없음·참고 문서 4건, 블로그 관리자 메모). 백엔드 117건 통과(작업 환경 Mac, 5433 DB).
- 미확인: 개발 DB에 `content/` 시드 실행, 기존 샘플 삭제, 실제 임베딩 색인, 화면 확인.

## 2026-09-28 — RAG 아키텍처 개요 문서

- 사용자 요청: 외부 참고 문서(RAG 발전 흐름, GraphRAG, Decision Model)와 현재 프로젝트를 비교 분석한 뒤, 같은 형식으로 현재 구조 정리 문서를 보관.
- `docs/02-design/RAG_ARCHITECTURE_OVERVIEW.md` 추가(Draft, 코드 기준 현황): 전체 흐름, 색인·질의 시퀀스, Vector + 참고 관계 1-hop, LLM 판단 2곳(FAQ·근거 부족), 미답변 → FAQ 순환, 세션, ERD, 일반 RAG 단계 대비표, 확장 후보(Hybrid, Skill 간선, Reranking, 개체 그래프 — 모두 미결정). RAG_DESIGN에 링크.
- 코드 변경 없음. 결정 변경 없음. Mermaid 렌더링은 로컬 도구(mmdc) 부재로 미검증.
- 사용자 요청으로 단독 공유용으로 재구성: 다른 문서 링크를 없애고 결정 이유·측정 수치(청킹, 검색 회수, 임계값 0.030, FAQ 거리 겹침, 판정 분리 결과)·SSE 이벤트·프롬프트 규칙·미답변 기록 항목을 본문에 포함. 문서 규칙(수치는 RAG_MEASUREMENTS 링크)의 예외이며, 문서 머리에 2026-09-28 스냅샷이고 기준 문서가 바뀌면 갱신해야 한다고 적었다.

## 2026-09-29 — sonic-portfolio UI 적용 (프론트 3단계)

- 사용자 요청: 별도 저장소 `sonic-portfolio`의 UI/UX 적용 가능 여부 검토 → 결정 5건 → 구현. sonic은 같은 스택이지만 데이터가 전부 목업이라 화면은 옮기고 데이터는 기존 API에 연결했다.
- 사용자 결정: 현재 URL 유지, 데이터에 없는 UI는 제외, 블로그 카테고리 단일 선택(필수, 먼저 적힌 것 유지), 대화 여러 개 + 24시간 뒤 목록·본문 숨김, 다크·라이트(기본 시스템), 그래프는 스킬·카테고리 노드까지 넣되 다른 작업 뒤에.
- 백엔드: V4(`blog_category` → `blog_post.category_id`), 공개 `category{code,name}`, 관리 `categoryId`, 공개 `GET /api/blog/categories`. 시드·`content/`·`samples/` front matter `category:`. 118건 통과.
- 어드민: 글 편집 카테고리 select, 스키마·테스트 갱신(15건).
- 포트폴리오: 디자인 토큰(라이트 신규), 사이드바 셸, 프로젝트·블로그·소개·홈·대화 화면 교체, 대화 저장소(`lib/chat-store.ts`) — 본문은 서버에서만, 만료·404 시 제거. 테스트 18건, lint, build 통과. 브라우저로 실제 백엔드 확인(질문 2회 사용).
- 주의: 작업 중 사용자의 `bootRun`(devtools)이 새 클래스를 다시 읽어 **개발 DB에 V4가 이미 적용됐다.** 기존 글의 카테고리는 `display_order`가 앞선 것 하나로 남았다(예: 프론트엔드). 계획한 매핑은 `content/` 재시드로 반영된다.
- 문서: ADR-0005 후속 3, ADR-0011 후속, ADR-0012 후속 결정 2, GRAPH_DESIGN 결정, API_DESIGN, DATA_MODEL, CONTENT_SPEC, FRONTEND_IMPLEMENTATION 3단계.
- 미검증: 사용자 화면 확인, 어드민 카테고리 저장, 태블릿 레일. 개발 모드 홈 Lottie 미표시(프로덕션 정상).

## 2026-09-29 — 카테고리 색과 참고 문서 카테고리 칩

- 사용자 요청: 참고 문서 목록에서 글의 카테고리를 사이드바처럼 색 칩으로 보여주기. 서버 작업을 먼저.
- 사용자 결정: 색은 서버에 HEX로 저장(팔레트 키·프론트 매핑 대신). 대비 문제는 색을 점에만 쓰고 글자는 중립색으로 두어 피한다(ADR-0005 후속 3 보강).
- 백엔드: V5 `category.color`(기본 `#8B8B94`, 기존 코드는 프론트에서 쓰던 색으로 채움, 대문자 `#RRGGBB` 체크), 관리 요청 `color` 필수, 공개 `category{code,name,color}`, 카테고리 목록 `color`, 참고 문서(블로그)에 `category`. 시드 taxonomy 표에 `color` 열. 118건 통과.
- 어드민: 카테고리 색 선택·목록 스와치. 포트폴리오: `CategoryDot`이 서버 색을 쓰고 참고 문서에 칩 추가, `lib/categories.ts`와 `--s-cat-*`(기본색 제외) 삭제. 테스트 어드민 15·포트폴리오 19건, build 통과. 실제 백엔드로 라이트·다크 확인(devtools가 V5를 개발 DB에 적용).
- 미검증: 어드민에서 색 변경 저장(사용자 확인).

## 2026-09-29 — 그래프 (ADR-0015)

- 사용자 요청: 그래프 작업 순서 정리 → "권장안대로". 결정: 라이브러리 `react-force-graph-2d` + `d3-force`, 스킬 노드 기본 숨김, 참고 방향 옅은 화살표, 노드 4종 모양, 종류별 패널, (샘플 정리는 사용자가 어드민에서).
- 규모(개발 DB, 옛 샘플 포함): 노드 65, 간선 131(스킬 97). 
- 백엔드: `graph` 패키지 `GET /api/graph`(JdbcTemplate SQL, 공개만, 사용하는 카테고리·스킬만). 테스트 2건, 전체 120건.
- 포트폴리오: sonic 그래프 이식·확장(`lib/graph.ts` 모델·테스트, `graph-layout`, `graph-canvas`, 필터·패널·모바일 목록·`NodeMark`), 사이드바 메뉴, 상세·카테고리 딥링크. 22건, build 통과.
- 구현 중 바꾼 것: 숨긴 종류를 시뮬레이션에 남기면 배치가 퍼지고 크기·라벨이 스킬 연결로 부풀어, **보이는 종류만으로 배치**하도록 바꿈(GRAPH_DESIGN 5절). 스킬을 켜면 0.5 배율 하한 때문에 화면에 다 안 들어와 최소 배율을 0.2로 낮춤.
- 문서: ADR-0015, GRAPH_DESIGN(Accepted, API·간선 표·화면), API_DESIGN, ARCHITECTURE·BACKLOG의 라이브러리 항목 완료, FRONTEND_IMPLEMENTATION 그래프 절.
- 미검증: 사용자 화면 확인, 태블릿 폭, reduced-motion.

## 2026-09-29 — 그래프 기본 전체 보기·URL 상태

- 사용자 요청: 기본 노출을 전체 보기로, 노드 필터와 선택을 URL 파라미터로 유지해 새로고침·뒤로 가기에도 남게.
- 구현: `DEFAULT_HIDDEN` 제거, `parseGraphParams`/`toGraphParams`(`node`, `hide`, `q`, 기본값 생략, 알 수 없는 종류 무시) + 테스트. 화면은 `useSearchParams`로 초기 상태를 읽고 `history.replaceState`로 쓴다. 바깥에서 들어온 쿼리(사이드바·딥링크)는 마지막으로 쓴 값과 비교해 반영.
- 브라우저 확인: 기본 65노드, 필터 → `?hide=category`, 검색 → `&q=`, 쿼리로 진입 시 선택·필터·검색 복원, "글 열기" 후 뒤로·다른 메뉴 후 뒤로·새로고침에서 유지, 사이드바 "그래프"로 초기화.
- 문서: ADR-0015 후속 결정, GRAPH_DESIGN, FRONTEND_IMPLEMENTATION.

## 2026-09-29 — 그래프 "두 번 렌더" 원인과 수정

- 사용자 보고: 진입·새로고침 때 그래프가 그려진 뒤 다시 렌더되며 가운데 정렬되는 느낌.
- 측정(임시 계측, 제거함): 캔버스 삽입 1회, 시뮬레이션 시작 1회. 356ms부터 배율 1로 120틱 애니메이션, 1371ms 엔진 정지 시 맞춤 배율 0.39를 즉시 적용 → 점프. 개발 모드 StrictMode의 이중 호출(데이터 생성·라이브러리 로드)은 화면과 무관.
- 사용자 선택 A: 배치를 미리 계산(`settleGraphData`를 항상)하고 캔버스가 붙으면 즉시 맞춤, 딥링크는 애니메이션 없이 그 노드로. 라이브러리 시뮬레이션 미사용. ADR-0015 후속 결정 2.
- 확인: 0.5초·2초 스크린샷이 같음(진입·딥링크·필터 전환). 테스트 23건, build 통과. 드래그 감각은 미검증.

## 2026-09-29 — 그래프 튀기·드래그 효과 복원

- 사용자 보고: 통통 튀는 효과와 드래그 시 이웃이 따라오는 애니메이션이 사라짐. 원인은 직전 수정에서 모든 노드 고정(`fx/fy`), `cooldownTicks=0`, 라이브러리 힘 설정 삭제. 드래그 효과까지 사라진다는 점을 미리 분명히 알리지 못했다.
- 사용자 선택: 진입 시 가볍게 튀기 + 놓은 노드도 움직이게.
- 수정: 미리 계산한 배치로 첫 화면 맞춤은 유지, 고정 해제, 라이브러리 시뮬레이션에 우리 힘을 첫 틱 전에 다시 얹음, 120틱 냉각, 드래그 종료 시 재고정 제거. 움직임 줄이기면 고정·시뮬레이션 없음.
- 확인: 진입 0.4초 → 0.9초 사이 노드만 살짝 이동하고 틀은 유지, 드래그 후 이웃이 끌려오고 놓은 노드가 되튀어 정착. 테스트 23건, build 통과.

## 2026-09-29 — 반복 드래그 버그, 클릭 시 가운데 이동

- 사용자 질문: 한 번 드래그한 노드가 다시 고정되는지. 확인 결과 **두 번째 드래그부터 물리가 돌지 않는 버그**(sonic 원본에도 있음). force-graph는 매 틱 `alpha < d3AlphaMin`이면 멈추는데, 첫 드래그 후 alpha가 최솟값 아래로 내려가 다음 드래그 첫 틱에 바로 멈췄다. `d3AlphaMin=0`으로 틱 수로만 멈추게 해 해결(같은 노드 두 번 드래그로 확인).
- 사용자 요청: 노드 클릭 시 부드럽게 가운데로. 클릭하면 선택과 함께 패널 폭을 뺀 영역 가운데로 0.42초 이동.
- 테스트 23건, build 통과.

## 2026-10-01 — 채팅 SSE 클라이언트 방식 ADR 기록

- 사용자 요청: 프론트엔드 SSE 처리 로직 설명, `EventSource`를 쓰지 않은 이유를 ADR로 남기기.
- 문서: ADR-0016 신규(fetch + ReadableStream + 자체 파서, 대안 EventSource·fetch-event-source 비교). ADR-0008 Related, API_DESIGN "구현 시 구체화" 항목에 링크. 코드 변경 없음.
- 확인한 근거: `frontend/portfolio/src/lib/sse.ts`, `lib/chat-api.ts`, `hooks/use-conversation.ts`. 기존 docs에는 "SSE(fetch 스트림)"만 있고 이유는 없었다.
- 참고: FRONTEND_IMPLEMENTATION 55행의 "404면 새 세션으로 1회 재시도"는 현재 코드(`onExpired`, 새 세션으로 몰래 바꾸지 않음)와 다르다. 이번에는 고치지 않았다(추가 확인 필요).

## 2026-10-04 — 배포 구성 변경(ADR-0017)과 배포 계획

- 사용자 요청: 실제 배포까지 남은 과정과 AWS 배포 절차 정리. 이어서 질의응답으로 구조를 검토했다.
- 확인한 사실: admin과 포트폴리오 채팅은 상대 경로 `/api`를 개발 서버 프록시(Vite proxy, Next rewrites)로 넘긴다. CORS 미사용과 같은 사이트 쿠키(ADR-0010 4절)를 위한 선택이었고, 배포 경로는 도메인 결정 때 정하기로 미뤄져 있었다(ADR-0012). 운영 프로필이 없다(DB URL, AI 활성화가 local 프로필에만 있음). HTTPS 프록시 도구는 정한 적이 없었다(초안 계획에서 Caddy를 결정된 것처럼 쓴 오류를 사용자가 지적해 정정).
- 사용자 결정: RDS 대신 같은 서버의 Docker PostgreSQL. 서버는 Lightsail 4GB, 프록시는 Caddy. ADR-0017 신규. ADR-0002 RDS 후속 결정과 ADR-0003 서버·DB 부분을 대체 표시했다.
- 제안(미확정): admin은 Vercel rewrite(콜백 `redirect-uri` 고정, 성공 URL 전체 주소)로 쿠키를 admin 호스트에 유지. 채팅은 Vercel을 거치면 IP당 제한이 전체 공용이 되므로 api 도메인을 직접 호출.
- 문서: ADR-0017, DEPLOYMENT_PLAN 신규. ADR-0002, ADR-0003, AWS_COST_PROPOSAL, ARCHITECTURE, CURRENT_PLAN, CURRENT_STATE, NEXT_ACTIONS 갱신. 코드 변경 없음.
- 미검증: 비용(계산값), 4GB 메모리 실측, Vercel 외부 rewrite의 쿠키·Location 전달, t4g.medium 단가(비교에서 추정치로만 언급).
- 같은 날 추가 사용자 결정: admin은 Vercel rewrite, 포트폴리오 채팅은 api 도메인 직접 호출. ADR-0017 Decision, ADR-0010 4절, DEPLOYMENT_PLAN, CURRENT_STATE, NEXT_ACTIONS에 반영. 남은 결정은 도메인과 백업 보관 위치.

## 2026-10-04 — 배포 코드 준비

- 사용자 결정: 도메인 `sonic-portfolio.com`, 백업은 우선 Lightsail 스냅샷만. 브랜치 `feat/deploy`(`feat/graph`에서 분기, 기존 미커밋 문서 변경 포함).
- 백엔드: `application-prod.properties`(DB 환경변수, OpenAI 켜기, `forward-headers-strategy=native`, GitHub `redirect-uri`·성공 URL·CORS 출처 고정), `SecurityConfig`(health 익명, CORS를 `/api/chat/**`·자격 증명 없음으로 축소; 기존 `/api/**`·credentials 설정은 관리 API까지 열 수 있었다), `DeploymentAccessTest` 4건, `Dockerfile`·`.dockerignore`.
- 배포 파일: `deploy/compose.prod.yaml`(db·api·caddy, 메모리 상한, 로그 제한, db 포트는 서버 loopback만), `Caddyfile`, `.env.example`, `README.md`(서버 준비·배포·시드·백업·Vercel 설정). `.gitignore`에 `deploy/.env`.
- 프론트: `chat-api.ts`에 `NEXT_PUBLIC_API_BASE_URL`(빈 값이면 개발용 상대 경로), admin `vercel.json`·`.env.production`.
- 확인한 사실: 시드 러너는 `@Profile("local")`이라 운영 컨테이너에서 못 돌린다 → 코드 변경 대신 SSH 터널로 Mac에서 local 시드 실행. Spring Security 7.1.1은 OAuth 콜백에서 redirect URI를 비교하지 않는다(바이트코드 확인).
- 검증: 백엔드 124건, 포트폴리오 23·어드민 15건, lint(기존 경고 2건만)·build 통과. prod 프로필 jar 로컬 기동으로 health·CORS·redirect_uri·Swagger 닫힘 확인. amd64 이미지 빌드, compose config 통과. admin 번들에 상대 로그인 경로 반영 확인.
- 미검증: Caddyfile 문법(caddy 이미지 실행이 멈춰 중단), 운영 메모리, X-Forwarded-For 방문자 IP 판별, Vercel rewrite 쿠키 전달.

## 2026-10-04 — 로컬 메모리 실측

- 사용자 요청: 로컬 메모리 측정. 실제 OpenAI 호출 포함(사용자 선택, 비용 수 센트). 첫 명령은 사용자가 거절해 방식을 물은 뒤 단계별로 다시 실행했다.
- 방법: scratchpad의 측정용 compose(운영과 같은 메모리 상한·Postgres 설정, arm64 네이티브 이미지, 새 DB). 시드가 컨테이너 안에서 돌도록 api는 local 프로필. 시드+전체 색인(19건 READY), 채팅 5개 순차와 3개 동시, 유휴 20초 동안 `docker stats` 기록.
- 결과: 최대 api 407 MiB(상한 1536), db 75 MiB(상한 1024), OOM·재시작 없음. 상세는 DEPLOYMENT_PLAN "메모리 실측".
- 참고: 로컬 Docker가 arm64 VM이라 이전에 받은 amd64 `eclipse-temurin:21-jre`가 태그를 덮어써 arm64 빌드가 실패했다. arm64로 다시 받아 해결. 측정 스택과 이미지는 삭제했다. 저장소 코드 변경 없음.
- 미검증: 1~2초 간격 측정이라 순간 최대치, 장시간 운영 시 JVM 힙 증가, Caddy 메모리.

## 2026-10-04 — 실제 콘텐츠 재변환

- 사용자 요청: 운영 시드 전에 새 Notion 위키(`~/Downloads/원티드 프로젝트/notion-wikis`)로 시드 데이터를 다시 만들기. 프로젝트 README의 결정사항/트러블슈팅 섹션은 제거하고, 거기 링크된 파일은 블로그로 만들어 참고 문서로 연결. 기존 프로젝트·블로그 시드는 모두 삭제.
- 구현: `content/convert_wiki.py`(판단이 필요한 slug·카테고리·태그·featured만 표로 두고 나머지는 기계 변환, 다시 실행 가능). 프로젝트 13·블로그 24·스킬 70·태그 44, 카테고리 8(`백엔드`·`AI·RAG` 추가). `content/README.md` 규칙 갱신.
- 판단(사용자 확인 필요): `template/`(가상 프로젝트)와 링크되지 않은 `references/fsd-notes.md` 제외, 이미지 10개 제외(업로드 기능 없음, 관리자 메모에 기록), 작성일 2026-10-04, featured는 최근 시작 3건, organization은 VIORA만, `FSD`는 스킬이 아니라 태그, 기간 괄호 설명은 사라짐.
- 검증: 로컬 Postgres 임시 DB(`portfolio_seedcheck`)에 시드 → 프로젝트 13·블로그 24·관계 25·featured 3, 오류 없음. 임시 DB 삭제. `samples/`는 그대로(테스트용).

## 2026-10-05 — 학습 노트를 시드에 추가

- 사용자 요청: `~/Downloads/sonic-study-notes/notes`(Obsidian llm-wiki, 59개)를 시드에 추가. 내용은 그대로, 연결 관계 분석·연동, 상위 메타데이터는 본문 제외. `/ecc:plan`으로 계획 후 결정: D1 공개, D2 태그로 주제별 기존 카테고리, D3 글자 없는 링크는 연결 노트 제목, D4 채팅 근거 포함.
- 분석: 메타데이터 6종(aliases·tags·prerequisites·related·status·created), 모두 draft, 본문 위키링크 224·메타 링크 119, 깨진 링크 없음(표 안 `\|` 9개는 정상), 코드 블록 안 `[[` 9개, 이미지 없음. 연결 쌍 220.
- 구현: `content/convert_wiki.py`에 노트 변환 추가(두 번째 인자). 태그 code 충돌(`embedding`)은 기존 `임베딩`으로 합침. 블로그 83·관계 245·태그 75.
- 검증: 링크 문법을 걷어 내면 59개 모두 원문과 글자까지 같음. 임시 DB 시드 블로그 83·관계 245·문서 96. 포트폴리오 화면에서 본문 링크·표·코드 블록·참고 문서 두 목록·그래프 확인, 콘솔 오류 없음.
- 발견·수정: `**청킹(Chunking)**은`처럼 닫는 `**` 뒤에 한글이 붙으면 CommonMark가 굵게로 보지 않아 235곳(50개 파일)에 `**`가 그대로 보였다. 콘텐츠는 바꾸지 않고 포트폴리오 마크다운(본문·채팅 답변)에 `remark-cjk-friendly` 추가, `markdown.test.tsx` 2건. 가장 많던 `clean-architecture`에서 굵게 82곳·남은 `**` 0 확인.
- 기타: `.claude/launch.json`에 확인용 `portfolio-web-seedcheck` 설정 추가(로컬). 포트폴리오 25·어드민 15건, lint·build 통과.

## 2026-10-05 — AI 도구 학습 노트 추가

- 사용자 요청: `ai-github-study-automation/learning-notes`(도구 15종 × README + 01~08장, 메타데이터 없음)를 우리 형식으로 저장. `/ecc:plan`으로 계획 후 "추천대로 진행": 도구별 한 글로 합침(E1), 카테고리 `AI 도구`(E2), 작성일 `studiedAt`(E3), `## 원본 저장소` 섹션(E4), 채팅 근거 포함(E5), 태그 없음(E6).
- 구현: `convert_wiki.py` 세 번째 인자. README 목차·이동 줄 제거, 장 제목 단계 내림, 장 링크→같은 글 안 이동 링크(`lib/headings.ts` 규칙), GitHub 주소·날짜는 원본 저장소 `studies/`·`data/registry.json`·git에서.
- 고친 결함: (1) 시드 `SampleMarkdown.sections`가 코드 블록 안의 `## ` 줄로 섹션을 나눔 → 펜스 추적, `SampleMarkdownTest` 추가. 이미 커밋된 `rag-chunking`도 해당. (2) 변환기 코드 블록 판정이 ````(4개) 펜스 안의 ```를 잘못 짝지음 → 같은 문자·같거나 긴 펜스로만 닫기. (3) EVAR 블로그 요약에 목록 뒤 안내 문단과 링크가 섞임 → 들여쓴 설명만 요약, 그 링크는 EVAR 참고 문서로(관계 +2). (4) `SampleSeederTest.seedsRealContent`가 10-04 콘텐츠 재변환 이후 실패 상태였음(그 세션에서 백엔드 테스트 미실행) → 현재 콘텐츠 기준으로 갱신.
- 검증: 도구 15개 원문 글자 비교 통과, 학습 노트 59개 재확인 통과. 임시 DB 시드 블로그 98·관계 247, API로 rag-chunking 섹션 정상·featured·EVAR 참고 4건 확인. 화면: `ecc` 목차·코드 49개·저장소 링크, 15개 글의 이동 링크 141개 모두 대상 있음, `AI 도구` 카테고리 15. 백엔드 125건 통과(첫 실행이 10분 넘게 멈춰 중단, 다시 실행하니 21초에 통과, 원인 미확인).
- 남은 것: 색인 `Chunker`도 `^## `로 나눠 코드 블록 안 줄에서 조각이 갈린다(검색 품질 영향만, 화면 영향 없음). 별도 작업으로 남김.

## 2026-10-05 — 카테고리 재정리와 카테고리별 채팅 반영(ADR-0018)

- 사용자 요청: `트러블슈팅`·`기술선택` 추가, 프로젝트 경험 글을 그쪽으로 이동, `UX`·`협업`·`AI`로 이름 간소화, 경험(트러블슈팅·기술선택·협업)과 학습(나머지) 구분, 카테고리별로 RAG 반영 여부를 고르는 기능. 계획 후 "추천대로": 분류표 그대로(F1), 빈 `UX`·`하드웨어` 삭제(F2), 경험 3개만 채팅 근거(F3).
- 콘텐츠: `convert_wiki.py`의 `CATEGORIES`(rag 열 포함)·`BLOGS` 분류·`NOTE_CATEGORIES` 수정. 카테고리 9개, 경험 글 트러블슈팅 5·기술선택 13·협업 6.
- 기능: V6 `category.rag_enabled`(기본 true), `Retriever.RAG_SCOPE`를 벡터 검색과 참고 관계 확장 쿼리에 추가(검색 시점, 재색인 불필요), `CategoryRequest.ragEnabled`(생략 시 생성 true·수정 유지)·응답 필드, 시드 `taxonomy.md` `rag` 열(`samples/taxonomy.md`도 5열로), 어드민 분류 화면 "채팅 반영" 체크박스와 목록의 "채팅 제외" 표시.
- 테스트: `ChatApiTest.postsInCategoriesKeptOutOfChatAreNeverEvidence`(검색·확장 제외, 다시 켜면 바로 포함), `TaxonomyAdminApiTest`(기본 true, 끄기, 생략 시 유지), `SampleSeederTest`(경험 3개만 rag), 어드민 스키마 테스트. 백엔드 126·어드민 15·포트폴리오 25건, lint·build 통과.
- 문서: ADR-0018 신규, API_DESIGN·DATA_MODEL·RAG_DESIGN·content/README 갱신.
- 미검증: 어드민 화면 직접 확인(GitHub 로그인 필요), 운영 DB 반영.

## 2026-10-08 — 운영 재배포와 운영 시드 완료

- 사용자가 안내에 따라 운영 서버에 새 이미지를 재배포(V6 적용)하고 운영 DB 시드를 실행했다. 다른 장소에서 작업해 SSH가 시간 초과 → Lightsail 방화벽에 현재 IP(122.202.248.4) 추가로 해결.
- 확인(공개 API): health UP, 프로젝트 13·featured 3, 블로그 98, 카테고리 9개 글 수(트러블슈팅 5·기술선택 13·협업 6·프론트엔드 5·백엔드 17·AI 17·아키텍처 15·배포·인프라 5·AI 도구 15), `rag-chunking` 섹션 10·참고 3·피참고 4, `ecc` 200.
- 미확인: 색인 READY 111(사용자 DBeaver 확인 사항), 운영 채팅의 출처 범위, 관리자 로그인.
- 문서: DEPLOYMENT_PLAN 체크리스트(서버·비밀값·배포·시드 완료), CURRENT_STATE, NEXT_ACTIONS.

## 2026-10-08 — 운영 채팅이 근거를 못 찾던 문제

- 사용자 보고: 운영 채팅 확인 명령이 출처를 하나도 출력하지 않음.
- 확인: 세션 생성 201, 응답은 `status`·`answer_delta`·`done{sources:[], unanswered:true}`로 `documents` 이벤트 없음. 운영 DB 색인은 정상(READY 111, 임베딩 조각 1828).
- 원인: `document_chunk` HNSW 인덱스가 후보를 기본 40개만 뽑고 `WHERE`(공개·ADR-0018 카테고리)로 거른다. 질문과 가까운 조각이 모두 꺼진 학습 글이면 0건. 운영 DB에서 `rag-chunking` 조각 벡터로 같은 조건 검색 시 기본 0건, `hnsw.iterative_scan = strict_order`로 5건 재현.
- 수정: `application.properties`에 Hikari `connection-init-sql=SET hnsw.iterative_scan = strict_order`(모든 프로필). 테스트 `ChatApiTest.vectorSearchKeepsScanningPastFilteredRows`(연결 설정 확인). 백엔드 127건 통과. ADR-0018·RAG_DESIGN에 기록.
- 반성: ADR-0018 구현 때 로컬 테스트는 데이터가 적어 인덱스 동작이 드러나지 않았다. 큰 데이터의 HNSW + 필터 검증은 NEXT_ACTIONS에 "HNSW 별도 검증"으로 남아 있던 항목이었다.
- 남은 것: 운영 서버에 새 이미지 재배포 후 채팅 재확인(재색인·재시드 불필요).
