-- ADR-0013: questions the chat could not answer from public evidence. Kept 90 days (configurable).
create table chat_unanswered_question (
  id          bigint generated always as identity primary key,
  question    text not null,
  answer      text not null,
  reason      text not null check (reason in ('NO_EVIDENCE', 'NO_CITATION')),
  retrieved   jsonb not null default '[]',   -- [{type, slug, title, distance}] at answer time
  session_id  bigint references chat_session(id) on delete set null,
  status      text not null default 'OPEN' check (status in ('OPEN', 'RESOLVED', 'IGNORED')),
  admin_note  text,
  created_at  timestamptz not null default now(),
  handled_at  timestamptz
);
create index chat_unanswered_question_status_idx on chat_unanswered_question (status, created_at desc);
create index chat_unanswered_question_session_idx on chat_unanswered_question (session_id);
create index chat_unanswered_question_created_idx on chat_unanswered_question (created_at);
