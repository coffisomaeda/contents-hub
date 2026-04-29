-- =============================================================================
-- Contents Hub: Row Level Security (RLS) 設定
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles: 個人のプロファイル情報
-- 自分のデータのみ参照・更新可能
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "ユーザーは自分のプロファイルを参照できる"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "ユーザーは自分のプロファイルを更新できる"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 2. contents: マスタデータ (共通)
-- 認証済みユーザーは全員参照・追加可能（更新・削除は不可）
-- ---------------------------------------------------------------------------
alter table public.contents enable row level security;

create policy "認証済みユーザーは全コンテンツを参照できる"
  on public.contents for select
  to authenticated
  using (true);

create policy "認証済みユーザーはコンテンツを追加できる"
  on public.contents for insert
  to authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- 3. books: マスタデータ (書籍)
-- ---------------------------------------------------------------------------
alter table public.books enable row level security;

create policy "認証済みユーザーは全書籍を参照できる"
  on public.books for select
  to authenticated
  using (true);

create policy "認証済みユーザーは書籍を追加できる"
  on public.books for insert
  to authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- 4. games: マスタデータ (ゲーム)
-- ---------------------------------------------------------------------------
alter table public.games enable row level security;

create policy "認証済みユーザーは全ゲームを参照できる"
  on public.games for select
  to authenticated
  using (true);

create policy "認証済みユーザーはゲームを追加できる"
  on public.games for insert
  to authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- 5. videos: マスタデータ (映像作品)
-- ---------------------------------------------------------------------------
alter table public.videos enable row level security;

create policy "認証済みユーザーは全映像作品を参照できる"
  on public.videos for select
  to authenticated
  using (true);

create policy "認証済みユーザーは映像作品を追加できる"
  on public.videos for insert
  to authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- 6. video_sources: マスタデータ (配信情報)
-- ---------------------------------------------------------------------------
alter table public.video_sources enable row level security;

create policy "認証済みユーザーは全配信情報を参照できる"
  on public.video_sources for select
  to authenticated
  using (true);

create policy "認証済みユーザーは配信情報を追加できる"
  on public.video_sources for insert
  to authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- 7. user_contents: ユーザーのトラッキングデータ（感想・ステータス等）
-- 自分のデータのみ CRUD 全て可能
-- ---------------------------------------------------------------------------
alter table public.user_contents enable row level security;

create policy "自分のデータを参照できる"
  on public.user_contents for select
  to authenticated
  using (auth.uid() = user_id);

create policy "自分のデータを追加できる"
  on public.user_contents for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "自分のデータを更新できる"
  on public.user_contents for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "自分のデータを削除できる"
  on public.user_contents for delete
  to authenticated
  using (auth.uid() = user_id);
