-- 카테고리 색(2026-09-29 사용자 결정: 서버에 HEX 저장). 화면은 점(dot)에만 쓰고 글자는 중립색이라
-- 라이트·다크 대비를 따로 맞추지 않는다. 기존 코드에는 프론트에서 쓰던 색을 옮겨 둔다.
alter table category add column color text not null default '#8B8B94'
  check (color ~ '^#[0-9A-F]{6}$');

update category set color = case code
  when 'frontend' then '#C7772A'
  when 'architecture' then '#7F5FC0'
  when 'ux' then '#2E93A8'
  when 'collaboration' then '#2F8A6E'
  when 'infra' then '#B35A3F'
  when 'hardware' then '#6B7386'
  when 'web-api' then '#2E93A8'
  when 'realtime' then '#B8425F'
  else color end;
