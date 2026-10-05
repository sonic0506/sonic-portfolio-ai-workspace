-- 카테고리별 채팅 근거 사용 여부(ADR-0018, 2026-10-05 사용자 결정). 검색 시점에 거르므로 바꿔도 재색인이 필요 없다.
-- 기본은 사용. 실제 값은 시드(content/taxonomy.md의 rag 열)와 어드민이 정한다.
alter table category add column rag_enabled boolean not null default true;
