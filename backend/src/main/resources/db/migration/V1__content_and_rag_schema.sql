-- Initial schema from docs/02-design/DATA_MODEL.md. Change via a new migration after application.
create extension if not exists vector;

create table skill (
  id         bigint generated always as identity primary key,
  code       text not null unique,   -- 참조 키: web-serial
  name       text not null,          -- 표시명: Web Serial API
  icon_key   text,
  created_at timestamptz not null default now()
);

create table profile (
  id         bigint generated always as identity primary key,
  headline   text not null,   -- 소개 한 줄 요약
  short_bio  text not null,   -- 상세 본문과 별개의 짧은 소개 문구
  image_url  text,
  github_url text,
  email      text,
  updated_at timestamptz not null default now()
);

create table career (
  id            bigint generated always as identity primary key,
  profile_id    bigint not null references profile(id) on delete cascade,
  company       text not null,
  role          text,
  period_start  date not null,
  period_end    date,          -- null = 재직 중
  description   text,
  display_order int not null default 0
);
create index career_profile_id_idx on career (profile_id);

create table profile_skill (
  profile_id    bigint not null references profile(id) on delete cascade,
  skill_id      bigint not null references skill(id) on delete restrict,
  skill_group   text not null check (skill_group in
                   ('PRIMARY', 'PROJECT_EXPERIENCE', 'LEARNING', 'COLLABORATION')),
  display_order int not null default 0,
  primary key (profile_id, skill_id)
);
create index profile_skill_skill_id_idx on profile_skill (skill_id);

create table project (
  id                bigint generated always as identity primary key,
  slug              text not null unique,
  title             text not null,
  summary           text not null,      -- 한 줄 요약
  organization      text,               -- 소속: 사내 프로덕트 / 프리랜서
  position          text,               -- 담당 포지션
  contribution      int check (contribution between 0 and 100),
  contribution_note text,               -- "담당 3개 컴포넌트 100%"
  period_start      date not null,
  period_end        date,               -- null = 진행 중
  thumbnail_url     text,
  featured          boolean not null default false,
  published         boolean not null default false,
  published_at      timestamptz,
  display_order     int not null default 0,
  github_url        text,
  service_url       text,
  admin_note        text,               -- 관리자 전용. Public/RAG 모두 제외
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index project_public_list_idx
  on project (display_order, period_start desc, id desc)
  where published;

create table project_highlight (       -- 핵심 요약 리스트
  id            bigint generated always as identity primary key,
  project_id    bigint not null references project(id) on delete cascade,
  content       text not null,
  display_order int not null default 0
);
create index project_highlight_project_id_idx on project_highlight (project_id);

create table project_skill (
  project_id    bigint not null references project(id) on delete cascade,
  skill_id      bigint not null references skill(id) on delete restrict,
  display_order int not null default 0,
  primary key (project_id, skill_id)
);
create index project_skill_skill_id_idx on project_skill (skill_id);

create table blog_post (
  id            bigint generated always as identity primary key,
  slug          text not null unique,
  title         text not null,
  summary       text,
  thumbnail_url text,
  published     boolean not null default false,
  published_at  timestamptz,
  admin_note    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index blog_post_published_idx on blog_post (published_at desc, id desc)
  where published;

create table category (
  id            bigint generated always as identity primary key,
  code          text not null unique,
  name          text not null,
  display_order int not null default 0
);

create table tag (
  id   bigint generated always as identity primary key,
  code text not null unique,
  name text not null
);

create table blog_category (
  blog_post_id bigint not null references blog_post(id) on delete cascade,
  category_id  bigint not null references category(id) on delete restrict,
  primary key (blog_post_id, category_id)
);
create index blog_category_category_id_idx on blog_category (category_id);

create table blog_tag (
  blog_post_id bigint not null references blog_post(id) on delete cascade,
  tag_id       bigint not null references tag(id) on delete cascade,
  primary key (blog_post_id, tag_id)
);
create index blog_tag_tag_id_idx on blog_tag (tag_id);

create table blog_skill (
  blog_post_id bigint not null references blog_post(id) on delete cascade,
  skill_id     bigint not null references skill(id) on delete restrict,
  primary key (blog_post_id, skill_id)
);
create index blog_skill_skill_id_idx on blog_skill (skill_id);

create table content_section (
  id            bigint generated always as identity primary key,
  project_id    bigint references project(id)   on delete cascade,
  blog_post_id  bigint references blog_post(id) on delete cascade,
  profile_id    bigint references profile(id)   on delete cascade,
  title         text not null,
  body_markdown text not null,
  display_order int not null default 0,
  constraint content_section_single_owner
    check (num_nonnulls(project_id, blog_post_id, profile_id) = 1)
);

create index content_section_project_idx   on content_section (project_id, display_order)
  where project_id is not null;
create index content_section_blog_idx      on content_section (blog_post_id, display_order)
  where blog_post_id is not null;
create index content_section_profile_idx   on content_section (profile_id, display_order)
  where profile_id is not null;

create table document (
  id                bigint generated always as identity primary key,
  document_type     text not null check (document_type in
                      ('PROFILE', 'CAREER', 'PROJECT', 'BLOG')),
  source_id         bigint not null,
  title             text not null,
  content           text not null,
  metadata          jsonb not null default '{}',
  visible           boolean not null default false,
  source_updated_at timestamptz,
  index_status      text not null default 'PENDING' check (index_status in
                      ('PENDING', 'INDEXING', 'READY', 'FAILED')),
  index_error       text,
  indexed_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (document_type, source_id)
);
create index document_visible_idx on document (document_type) where visible;

create table document_chunk (
  id            bigint generated always as identity primary key,
  document_id   bigint not null references document(id) on delete cascade,
  chunk_index   int not null,
  content       text not null,
  section_titles text[] not null default '{}',  -- 유래한 섹션들. 청크 경계와 1:1이 아니다
  token_count   int,
  embedding     vector(1536),  -- text-embedding-3-small 실측 (ADR-0006)
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  unique (document_id, chunk_index)
);
create index document_chunk_document_id_idx on document_chunk (document_id);
create index document_chunk_embedding_idx on document_chunk
  using hnsw (embedding vector_cosine_ops);

create table document_relation (
  id                 bigint generated always as identity primary key,
  source_document_id bigint not null references document(id) on delete cascade,
  target_document_id bigint not null references document(id) on delete cascade,
  relation_type      text not null default 'RELATED_TO',
  created_at         timestamptz not null default now(),
  constraint document_relation_no_self
    check (source_document_id <> target_document_id),
  unique (source_document_id, target_document_id, relation_type)
);
create index document_relation_target_idx on document_relation (target_document_id);

create table chat_session (
  id             bigint generated always as identity primary key,
  public_id      uuid not null default gen_random_uuid() unique,
  visitor_key    text,
  created_at     timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  expires_at     timestamptz
);

create table chat_message (
  id         bigint generated always as identity primary key,
  session_id bigint not null references chat_session(id) on delete cascade,
  role       text not null check (role in ('USER', 'ASSISTANT')),
  content    text not null,
  created_at timestamptz not null default now()
);
create index chat_message_session_idx on chat_message (session_id, created_at);

create table chat_message_source (
  message_id  bigint not null references chat_message(id) on delete cascade,
  document_id bigint not null references document(id) on delete restrict,
  chunk_id    bigint references document_chunk(id) on delete set null,
  primary key (message_id, document_id)
);
create index chat_message_source_document_idx on chat_message_source (document_id);
