-- =============================================================================
-- #16: コンテンツ共有機能
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
-- 2. テーブル作成
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

-- ---------------------------------------------------------------------------
-- 3. RLS ポリシー
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

