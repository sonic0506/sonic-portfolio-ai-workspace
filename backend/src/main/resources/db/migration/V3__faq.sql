-- ADR-0014: registered questions and answers, indexed as RAG documents.
create table faq (
  id            bigint generated always as identity primary key,
  question      text not null,
  answer        text not null,
  published     boolean not null default true,
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Other phrasings of the same question (ADR-0014 decision 3; not exposed by the API yet).
create table faq_alias (
  id            bigint generated always as identity primary key,
  faq_id        bigint not null references faq(id) on delete cascade,
  question      text not null,
  display_order int not null default 0
);
create index faq_alias_faq_id_idx on faq_alias (faq_id);

alter table document drop constraint if exists document_document_type_check;
alter table document add constraint document_document_type_check
  check (document_type in ('PROFILE', 'CAREER', 'PROJECT', 'BLOG', 'FAQ'));
