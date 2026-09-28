-- 블로그 카테고리를 단일 선택으로 바꾼다(ADR-0005 후속 3). 기존 연결은 display_order가 가장 앞선 것 하나를 남긴다.
-- 필수 여부는 API(BlogPostAdminRequest)에서 검사한다. 카테고리 없는 기존 글이 있어도 마이그레이션은 실패하지 않는다.
alter table blog_post add column category_id bigint references category(id) on delete restrict;

update blog_post p set category_id = (
  select bc.category_id
  from blog_category bc join category c on c.id = bc.category_id
  where bc.blog_post_id = p.id
  order by c.display_order, c.code
  limit 1);

create index blog_post_category_id_idx on blog_post (category_id);

drop table blog_category;
