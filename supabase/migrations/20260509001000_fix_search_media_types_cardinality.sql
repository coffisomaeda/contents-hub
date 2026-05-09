-- =============================================================================
-- Contents Hub: 検索対象設定の空配列禁止を強制
-- =============================================================================

alter table public.profiles
  drop constraint profiles_search_media_types_allowed,
  add constraint profiles_search_media_types_allowed
    check (
      cardinality(search_media_types) >= 1
      and search_media_types <@ array['book', 'game', 'movie', 'tv']
    );
