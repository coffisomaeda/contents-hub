-- =============================================================================
-- Contents Hub: 登録機能の追加フィールド (#15)
-- =============================================================================

-- user_contents に電子書籍フラグ・売却フラグ・読了巻数を追加
alter table public.user_contents
  add column is_ebook boolean not null default false,
  add column is_sold boolean not null default false,
  add column current_volume integer,
  add constraint user_contents_not_ebook_and_sold
    check (not (is_ebook and is_sold)),
  add constraint user_contents_current_volume_positive
    check (current_volume is null or current_volume >= 1);

comment on column public.user_contents.is_ebook is '電子書籍かどうか';
comment on column public.user_contents.is_sold is 'メルカリ等で売却済みかどうか（物理書籍のみ）';
comment on column public.user_contents.current_volume is '読了巻数（漫画・シリーズ向け）';
