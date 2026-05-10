-- =============================================================================
-- #16: コンテンツ共有機能 & リスト機能
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles: SELECT ポリシーを拡張（共有先ユーザー検索のため全プロファイル参照可能に）
-- ---------------------------------------------------------------------------
drop policy if exists "ユーザーは自分のプロファイルを参照できる" on public.profiles;
create policy "認証済みユーザーは全プロファイルを参照できる"
  on public.profiles for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 2. テーブル作成（全テーブルを先に作成して循環参照を回避）
-- ---------------------------------------------------------------------------

-- content_shares: コンテンツ共有履歴
create table content_shares (
  id           uuid primary key default gen_random_uuid(),
  sharer_id    uuid not null references profiles (id) on delete cascade,
  recipient_id uuid not null references profiles (id) on delete cascade,
  content_id   uuid not null references contents (id) on delete cascade,
  message      text,
  created_at   timestamptz not null default now(),

  constraint content_shares_no_self_share check (sharer_id <> recipient_id),
  unique (sharer_id, recipient_id, content_id)
);

comment on table content_shares is '誰が誰にどのコンテンツを共有したかの履歴';

create index idx_content_shares_recipient on content_shares (recipient_id);
create index idx_content_shares_sharer on content_shares (sharer_id);

-- content_lists: ユーザー作成リスト
create table content_lists (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles (id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table content_lists is 'ユーザーが作成するコンテンツのリスト';

create index idx_content_lists_owner on content_lists (owner_id);

create trigger set_updated_at
  before update on content_lists
  for each row
  execute function public.update_updated_at();

-- content_list_items: リストのアイテム
create table content_list_items (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references content_lists (id) on delete cascade,
  content_id uuid not null references contents (id) on delete cascade,
  position   integer not null default 0,
  created_at timestamptz not null default now(),

  unique (list_id, content_id)
);

comment on table content_list_items is 'リストに含まれるコンテンツアイテム';

create index idx_content_list_items_list on content_list_items (list_id);

-- list_shares: リスト共有
create table list_shares (
  id           uuid primary key default gen_random_uuid(),
  list_id      uuid not null references content_lists (id) on delete cascade,
  sharer_id    uuid not null references profiles (id) on delete cascade,
  recipient_id uuid not null references profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),

  constraint list_shares_no_self_share check (sharer_id <> recipient_id),
  unique (list_id, recipient_id)
);

comment on table list_shares is 'リストの共有履歴';

create index idx_list_shares_recipient on list_shares (recipient_id);
create index idx_list_shares_list on list_shares (list_id);

-- ---------------------------------------------------------------------------
-- 3. RLS ポリシー（テーブル作成後にまとめて設定）
-- ---------------------------------------------------------------------------

-- content_shares
alter table content_shares enable row level security;

create policy "共有者は自分の共有を参照できる"
  on public.content_shares for select
  to authenticated
  using (auth.uid() = sharer_id);

create policy "受信者は自分宛ての共有を参照できる"
  on public.content_shares for select
  to authenticated
  using (auth.uid() = recipient_id);

create policy "共有者はコンテンツを共有できる"
  on public.content_shares for insert
  to authenticated
  with check (auth.uid() = sharer_id);

create policy "共有者は自分の共有を削除できる"
  on public.content_shares for delete
  to authenticated
  using (auth.uid() = sharer_id);

-- content_lists
alter table content_lists enable row level security;

create policy "オーナーは自分のリストを参照できる"
  on public.content_lists for select
  to authenticated
  using (auth.uid() = owner_id);

create policy "共有されたリストを参照できる"
  on public.content_lists for select
  to authenticated
  using (
    exists (
      select 1 from public.list_shares ls
      where ls.list_id = content_lists.id and ls.recipient_id = auth.uid()
    )
  );

create policy "オーナーはリストを作成できる"
  on public.content_lists for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "オーナーはリストを更新できる"
  on public.content_lists for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "オーナーはリストを削除できる"
  on public.content_lists for delete
  to authenticated
  using (auth.uid() = owner_id);

-- content_list_items
alter table content_list_items enable row level security;

create policy "リストオーナーはアイテムを参照できる"
  on public.content_list_items for select
  to authenticated
  using (
    exists (
      select 1 from public.content_lists cl
      where cl.id = list_id and cl.owner_id = auth.uid()
    )
  );

create policy "共有リストのアイテムを参照できる"
  on public.content_list_items for select
  to authenticated
  using (
    exists (
      select 1 from public.list_shares ls
      where ls.list_id = content_list_items.list_id and ls.recipient_id = auth.uid()
    )
  );

create policy "リストオーナーはアイテムを追加できる"
  on public.content_list_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.content_lists cl
      where cl.id = list_id and cl.owner_id = auth.uid()
    )
  );

create policy "リストオーナーはアイテムを削除できる"
  on public.content_list_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.content_lists cl
      where cl.id = list_id and cl.owner_id = auth.uid()
    )
  );

-- list_shares
alter table list_shares enable row level security;

create policy "リストオーナーは共有を参照できる"
  on public.list_shares for select
  to authenticated
  using (auth.uid() = sharer_id);

create policy "受信者はリスト共有を参照できる"
  on public.list_shares for select
  to authenticated
  using (auth.uid() = recipient_id);

create policy "リストオーナーはリストを共有できる"
  on public.list_shares for insert
  to authenticated
  with check (
    auth.uid() = sharer_id
    and exists (
      select 1 from public.content_lists cl
      where cl.id = list_id and cl.owner_id = auth.uid()
    )
  );

create policy "リストオーナーは共有を削除できる"
  on public.list_shares for delete
  to authenticated
  using (auth.uid() = sharer_id);

-- ---------------------------------------------------------------------------
-- 4. ユーティリティ関数
-- ---------------------------------------------------------------------------

-- メールアドレスからユーザーIDを取得する（auth.usersへのアクセスが必要なためsecurity definer）
create or replace function public.find_user_id_by_email(target_email text)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  found_id uuid;
begin
  select id into found_id
  from auth.users
  where email = target_email
  limit 1;

  return found_id;
end;
$$;
