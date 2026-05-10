-- =============================================================================
-- #17: ベクトル検索機能
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. pgvector 拡張を有効化
-- ---------------------------------------------------------------------------
create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------
-- 2. contents テーブルに embedding カラムを追加
-- ---------------------------------------------------------------------------
alter table public.contents
  add column title_embedding extensions.vector(1024);

create index idx_contents_title_embedding
  on public.contents
  using hnsw (title_embedding extensions.vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- 3. ベクトル類似検索 RPC 関数
-- ---------------------------------------------------------------------------
create or replace function public.match_contents(
  query_embedding extensions.vector(1024),
  match_threshold float default 0.5,
  match_count int default 10
)
returns table (
  id uuid,
  media_type text,
  title text,
  title_kana text,
  description text,
  image_url text,
  release_date text,
  item_url text,
  similarity float
)
language plpgsql
security invoker
as $$
begin
  return query
    select
      c.id,
      c.media_type,
      c.title,
      c.title_kana,
      c.description,
      c.image_url,
      c.release_date,
      c.item_url,
      1 - (c.title_embedding <=> query_embedding) as similarity
    from public.contents c
    where c.title_embedding is not null
      and 1 - (c.title_embedding <=> query_embedding) > match_threshold
    order by c.title_embedding <=> query_embedding
    limit match_count;
end;
$$;
