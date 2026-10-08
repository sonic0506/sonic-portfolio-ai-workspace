-- 원티드식 경력(ADR-0019, 2026-10-08 사용자 결정): 경력 아래 프로젝트별 "주요 성과"를 묶는다.
-- career.role은 직무로 쓰고, 고용형태와 직책을 더한다. description은 경력 요약으로 남는다.
alter table career add column employment_type text;
alter table career add column position text;

create table career_achievement (
  id            bigint generated always as identity primary key,
  career_id     bigint not null references career(id) on delete cascade,
  title         text not null,
  period_start  date not null,
  period_end    date,                                   -- null = 진행 중
  job           text,                                   -- 직무
  position      text,                                   -- 직책
  body_markdown text,
  project_id    bigint references project(id) on delete set null, -- 포트폴리오 프로젝트 연결(선택)
  display_order int not null default 0
);
create index career_achievement_career_id_idx on career_achievement (career_id);
create index career_achievement_project_id_idx on career_achievement (project_id);
