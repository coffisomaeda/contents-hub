-- 1. profiles テーブルに username カラムを追加
alter table public.profiles add column username text;

-- 2. 既存の profiles の行に対し、IDをベースにした暫定的な username を設定
-- (ハイフンを除去し、長さを調整してフォーマット制約を満たすようにする)
update public.profiles
set username = 'user_' || substring(replace(id::text, '-', ''), 1, 15);

-- 3. NOT NULL, UNIQUE, および CHECK 制約を追加
alter table public.profiles alter column username set not null;
alter table public.profiles add constraint profiles_username_unique unique (username);
alter table public.profiles add constraint profiles_username_format check (username ~* '^[a-zA-Z0-9_]{3,20}$');

comment on column public.profiles.username is 'ユーザー名（ユニーク）';

-- 4. 新規ユーザー作成時のトリガー関数 public.handle_new_user() をシンプルに更新
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email, 'User'),
    coalesce(
      new.raw_user_meta_data ->> 'username',
      'user_' || substring(replace(new.id::text, '-', ''), 1, 15)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

-- 5. 不要な関数の削除 (クリーンアップ)
drop function if exists public.find_user_id_by_email(text);
drop table if exists public.share_rate_limits cascade;
