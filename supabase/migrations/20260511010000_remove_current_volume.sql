-- =============================================================================
-- Contents Hub: user_books から current_volume を削除
-- 楽天 API は巻単位で書籍を返すため読了巻数の概念を廃止する
-- =============================================================================

alter table public.user_books
  drop constraint user_books_current_volume_positive,
  drop column current_volume;
