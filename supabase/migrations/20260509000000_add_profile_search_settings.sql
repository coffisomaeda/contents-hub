-- =============================================================================
-- Contents Hub: 検索対象設定
-- =============================================================================

alter table public.profiles
  add column search_media_types text[] not null default array['book', 'game', 'movie', 'tv'],
  add column settings_completed_at timestamptz,
  add constraint profiles_search_media_types_allowed
    check (
      cardinality(search_media_types) >= 1
      and search_media_types <@ array['book', 'game', 'movie', 'tv']
    );

comment on column public.profiles.search_media_types is '検索対象メディア種別';
comment on column public.profiles.settings_completed_at is '初回設定完了日時';

update public.profiles
set
  search_media_types = array['book', 'game', 'movie', 'tv'],
  settings_completed_at = now()
where settings_completed_at is null;
