-- 이미지 업로드(ADR-0020, 2026-10-08 사용자 결정): S3에 올린 이미지 기록과 로고 칸.
create table media (
  id            bigint generated always as identity primary key,
  object_key    text not null unique,
  url           text not null,
  original_name text,
  content_type  text not null,
  size_bytes    bigint not null check (size_bytes > 0),
  purpose       text not null check (purpose in ('PROFILE', 'THUMBNAIL', 'CAREER_LOGO', 'SKILL_ICON', 'CONTENT')),
  created_at    timestamptz not null default now()
);
create index media_purpose_idx on media (purpose, id desc);

alter table career add column logo_url text;   -- ADR-0019 로고 자리 → 실제 이미지
alter table skill add column icon_url text;    -- 있으면 simple-icons(icon_key) 대신 쓴다
