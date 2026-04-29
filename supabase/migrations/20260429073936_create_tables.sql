-- =============================================================================
-- Contents Hub: 初期テーブル作成
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles: ユーザープロファイル（auth.users と 1:1）
-- ---------------------------------------------------------------------------
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table profiles is 'ユーザープロファイル（auth.users と 1:1）';

-- auth.users に新規ユーザーが作成されたとき、自動で profiles に行を挿入するトリガー
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. contents: コンテンツ共通テーブル（全メディア横断）
-- ---------------------------------------------------------------------------
create table contents (
  id          uuid primary key default gen_random_uuid(),
  media_type  text not null check (media_type in ('book', 'game', 'movie', 'tv')),
  title       text not null,
  title_kana  text,
  description text,
  image_url   text,
  release_date date,
  item_url    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (id, media_type)
);

comment on table contents is 'コンテンツ共通テーブル（全メディア横断）';
comment on column contents.media_type is 'メディア種別: book, game, movie, tv';

-- ---------------------------------------------------------------------------
-- 3. books: 書籍固有テーブル（楽天ブックス書籍検索 API 対応）
-- ---------------------------------------------------------------------------
create table books (
  id               uuid primary key references contents (id) on delete cascade,
  isbn             text unique,
  author           text,
  author_kana      text,
  publisher_name   text,
  item_price       integer,
  rakuten_genre_id text,
  review_count     integer,
  review_average   numeric(3, 2)
);

comment on table books is '書籍固有情報（楽天ブックス書籍検索 API 対応）';

-- ---------------------------------------------------------------------------
-- 4. games: ゲーム固有テーブル（楽天ブックスゲーム検索 API 対応）
-- ---------------------------------------------------------------------------
create table games (
  id               uuid primary key references contents (id) on delete cascade,
  jan              text unique,
  hardware         text,
  label            text,
  maker_code       text,
  item_price       integer,
  rakuten_genre_id text,
  review_count     integer,
  review_average   numeric(3, 2)
);

comment on table games is 'ゲーム固有情報（楽天ブックスゲーム検索 API 対応）';

-- ---------------------------------------------------------------------------
-- 5. videos: 映像作品固有テーブル（TMDB API 対応）
-- ---------------------------------------------------------------------------
create table videos (
  id                  uuid primary key references contents (id) on delete cascade,
  media_type          text not null check (media_type in ('movie', 'tv')),
  tmdb_id             integer not null,
  original_title      text,
  poster_path         text,
  backdrop_path       text,
  genres              jsonb,
  vote_average        numeric(4, 2),
  vote_count          integer,
  runtime             integer,
  number_of_seasons   integer,
  number_of_episodes  integer,
  status              text,
  imdb_id             text,
  watchmode_id        integer,

  foreign key (id, media_type) references contents (id, media_type),
  unique (tmdb_id, media_type)
);

comment on table videos is '映像作品固有情報（TMDB API 対応）';
comment on column videos.tmdb_id is 'TMDB ID（contents.media_type と組み合わせて一意）';
comment on column videos.genres is 'ジャンル配列 [{id, name}]（TMDB 形式）';
comment on column videos.runtime is '上映時間（分、映画のみ）';
comment on column videos.number_of_seasons is 'シーズン数（TV のみ）';
comment on column videos.number_of_episodes is 'エピソード数（TV のみ）';

-- ---------------------------------------------------------------------------
-- 6. video_sources: 映像作品の配信情報（Watchmode API 対応）
-- ---------------------------------------------------------------------------
create table video_sources (
  id         uuid primary key default gen_random_uuid(),
  video_id   uuid not null references videos (id) on delete cascade,
  source_id  integer,
  name       text not null,
  type       text not null check (type in ('sub', 'rent', 'buy', 'free', 'tve')),
  region     text,
  web_url    text,
  format     text,
  price      numeric(10, 2),
  seasons    integer,
  episodes   integer,
  fetched_at timestamptz not null default now()
);

comment on table video_sources is '映像作品の配信情報（Watchmode API 対応）';
comment on column video_sources.type is '配信タイプ: sub, rent, buy, free, tve';

-- ---------------------------------------------------------------------------
-- 7. user_contents: ユーザーとコンテンツの関連テーブル
-- ---------------------------------------------------------------------------
create table user_contents (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles (id) on delete cascade,
  content_id uuid not null references contents (id) on delete cascade,
  status     text not null default 'want' check (status in ('want', 'doing', 'done')),
  rating     integer check (rating >= 1 and rating <= 5),
  memo       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, content_id)
);

comment on table user_contents is 'ユーザーとコンテンツの関連（ステータス・評価・メモ）';
comment on column user_contents.status is 'ステータス: want（気になる）, doing（進行中）, done（完了）';

-- =============================================================================
-- インデックス
-- =============================================================================

create index idx_contents_media_type on contents (media_type);
create index idx_user_contents_user_id on user_contents (user_id);
create index idx_user_contents_content_id on user_contents (content_id);
create index idx_user_contents_status on user_contents (status);
create index idx_video_sources_video_id on video_sources (video_id);
-- (tmdb_id, media_type) のユニークインデックスはテーブル定義の UNIQUE 制約で作成済み

-- =============================================================================
-- updated_at 自動更新トリガー
-- =============================================================================

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on profiles
  for each row
  execute function public.update_updated_at();

create trigger set_updated_at
  before update on contents
  for each row
  execute function public.update_updated_at();

create trigger set_updated_at
  before update on user_contents
  for each row
  execute function public.update_updated_at();
