-- =============================================================================
-- Contents Hub: user_books テーブルの追加
-- user_contents の書籍固有フィールドを分離し、コンテンツ側の型別テーブル構造と対称にする
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. user_books テーブル作成
-- ---------------------------------------------------------------------------
create table public.user_books (
  user_content_id uuid primary key references public.user_contents (id) on delete cascade,
  is_ebook        boolean not null default false,
  is_sold         boolean not null default false,
  constraint user_books_not_ebook_and_sold
    check (not (is_ebook and is_sold))
);

comment on table public.user_books is 'ユーザー×書籍固有の情報（電子書籍フラグ・売却フラグ）';
comment on column public.user_books.is_ebook is '電子書籍かどうか';
comment on column public.user_books.is_sold is 'メルカリ等で売却済みかどうか（物理書籍のみ）';

-- 書籍コンテンツにのみ user_books を許可するトリガー
create or replace function public.check_user_books_media_type()
returns trigger
language plpgsql
as $$
begin
  if (
    select contents.media_type
    from public.user_contents
    join public.contents on user_contents.content_id = contents.id
    where user_contents.id = new.user_content_id
  ) != 'book' then
    raise exception 'user_books は書籍コンテンツにのみ作成できます';
  end if;
  return new;
end;
$$;

create trigger ensure_user_books_is_book
  before insert or update on public.user_books
  for each row execute function public.check_user_books_media_type();

-- ---------------------------------------------------------------------------
-- 2. RLS 設定
-- ---------------------------------------------------------------------------
alter table public.user_books enable row level security;

create policy "自分のデータを参照できる"
  on public.user_books for select
  to authenticated
  using (
    user_content_id in (
      select user_contents.id from public.user_contents
      where user_contents.user_id = auth.uid()
    )
  );

create policy "自分のデータを追加できる"
  on public.user_books for insert
  to authenticated
  with check (
    user_content_id in (
      select user_contents.id from public.user_contents
      where user_contents.user_id = auth.uid()
    )
  );

create policy "自分のデータを更新できる"
  on public.user_books for update
  to authenticated
  using (
    user_content_id in (
      select user_contents.id from public.user_contents
      where user_contents.user_id = auth.uid()
    )
  )
  with check (
    user_content_id in (
      select user_contents.id from public.user_contents
      where user_contents.user_id = auth.uid()
    )
  );

create policy "自分のデータを削除できる"
  on public.user_books for delete
  to authenticated
  using (
    user_content_id in (
      select user_contents.id from public.user_contents
      where user_contents.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 3. 既存データの移行（書籍コンテンツのみ）
-- ---------------------------------------------------------------------------
insert into public.user_books (user_content_id, is_ebook, is_sold)
select
  user_contents.id,
  user_contents.is_ebook,
  user_contents.is_sold
from public.user_contents
join public.contents on user_contents.content_id = contents.id
where contents.media_type = 'book';

-- ---------------------------------------------------------------------------
-- 4. user_contents から書籍固有カラムを削除
-- ---------------------------------------------------------------------------
alter table public.user_contents
  drop column is_ebook,
  drop column is_sold,
  drop column current_volume;
