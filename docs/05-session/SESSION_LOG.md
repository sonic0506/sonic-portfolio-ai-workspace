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
