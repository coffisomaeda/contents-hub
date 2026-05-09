-- =============================================================================
-- Contents Hub: 初期シードデータ
-- =============================================================================

-- 1. テストユーザーの作成 (auth.users)
-- パスワードは 'password123'
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current
)
values
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test1@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "Test User 1", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Test1"}',
    now(),
    now(),
    '',
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test2@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "Test User 2", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Test2"}',
    now(),
    now(),
    '',
    '',
    '',
    '',
    ''
  );

-- 1b. テストユーザーの auth.identities 作成（signInWithPassword に必要）
insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
values
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'email', 'test1@example.com')::jsonb,
    'email',
    '00000000-0000-0000-0000-000000000001',
    now(), now(), now()
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000002',
    json_build_object('sub', '00000000-0000-0000-0000-000000000002', 'email', 'test2@example.com')::jsonb,
    'email',
    '00000000-0000-0000-0000-000000000002',
    now(), now(), now()
  );

-- profiles はトリガーによって自動生成されるため省略

-- 2. コンテンツ (contents) の作成
insert into public.contents (id, media_type, title, title_kana, description, image_url, release_date, item_url)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'book',
    '進撃の巨人（1）',
    'シンゲキノキョジン1',
    '巨人がすべてを支配する世界。巨人の餌と化した人類は、巨大な壁を築き、壁外への自由と引き換えに侵略を防いでいた...',
    'https://covers.openlibrary.org/b/isbn/9784063842760-L.jpg',
    '2010-03-17',
    'https://books.rakuten.co.jp/rb/6368481/'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'game',
    'ゼルダの伝説 ティアーズ オブ ザ キングダム',
    'ゼルダノデンセツ ティアーズオブザキングダム',
    '果てなき冒険は、大空へ広がる。『ゼルダの伝説 ブレス オブ ザ ワイルド』続編。',
    'https://images.igdb.com/igdb/image/upload/t_cover_big/co5vmg.jpg',
    '2023-05-12',
    'https://books.rakuten.co.jp/rb/17424606/'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'book',
    'プロダクトマネジメントのすべて',
    'プロダクトマネジメントノスベテ',
    'プロダクト開発に必要な戦略、ロードマップ、チーム運営、仮説検証を体系的に扱う実務書。',
    'https://covers.openlibrary.org/b/isbn/9784798166391-L.jpg',
    '2021-03-03',
    'https://books.rakuten.co.jp/rb/16567358/'
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'game',
    'ELDEN RING',
    'エルデンリング',
    '広大なフィールドとダンジョン探索、高い自由度のビルドを特徴とするアクションRPG。',
    'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg',
    '2022-02-25',
    'https://www.eldenring.jp/'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'movie',
    'マトリックス',
    'マトリックス',
    'トーマス・アンダーソンは、昼はプログラマー、夜は「ネオ」という凄腕ハッカーとして暗躍していた...',
    'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    '1999-03-30',
    null
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'tv',
    'ブレイキング・バッド',
    'ブレイキングバッド',
    '余命宣告を受けた高校の化学教師が、家族に財産を残すために麻薬の製造・密売に手を染めていく...',
    'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    '2008-01-20',
    null
  );

-- 3. 書籍固有 (books)
insert into public.books (id, isbn, author, author_kana, publisher_name, item_price, rakuten_genre_id, review_count, review_average)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '9784063842760',
    '諫山 創',
    'イサヤマ ハジメ',
    '講談社',
    495,
    '001001001',
    100,
    4.5
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '9784798166391',
    '及川 卓也、曽根原 春樹、小城 久美子',
    null,
    '翔泳社',
    2860,
    '001005017',
    42,
    4.3
  );

-- 4. ゲーム固有 (games)
insert into public.games (id, jan, hardware, label, maker_code, item_price, rakuten_genre_id, review_count, review_average)
values
  (
    '22222222-2222-2222-2222-222222222222',
    '4902370550337',
    'Nintendo Switch',
    '任天堂',
    'HAC-P-AXN7A',
    7920,
    '006001001',
    500,
    4.8
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    '4949776441067',
    'PlayStation 5',
    'フロム・ソフトウェア',
    'ELJM-30112',
    9240,
    '006515',
    820,
    4.7
  );

-- 5. 映像作品固有 (videos)
insert into public.videos (id, media_type, tmdb_id, original_title, poster_path, backdrop_path, genres, vote_average, vote_count, runtime, number_of_seasons, number_of_episodes, status, imdb_id, watchmode_id)
values
  (
    '33333333-3333-3333-3333-333333333333',
    'movie',
    603,
    'The Matrix',
    '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    '/aOIuZAjYnWLEAWqcx4rnMDkV8sC.jpg',
    '[{"id": 28, "name": "Action"}, {"id": 878, "name": "Science Fiction"}]',
    8.2,
    22000,
    136,
    null,
    null,
    'Released',
    'tt0133093',
    123456
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'tv',
    1396,
    'Breaking Bad',
    '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    '[{"id": 18, "name": "Drama"}, {"id": 80, "name": "Crime"}]',
    8.9,
    13000,
    null,
    5,
    62,
    'Ended',
    'tt0903747',
    234567
  );

-- 6. 配信情報 (video_sources)
insert into public.video_sources (video_id, source_id, name, type, region, web_url, format, price, seasons, episodes)
values
  (
    '33333333-3333-3333-3333-333333333333',
    203,
    'Netflix',
    'sub',
    'JP',
    'https://www.netflix.com/title/20557937',
    'HD',
    null,
    null,
    null
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    203,
    'Netflix',
    'sub',
    'JP',
    'https://www.netflix.com/title/70143836',
    'HD',
    null,
    5,
    62
  );

-- 7. ユーザー登録コンテンツ (user_contents)
insert into public.user_contents (user_id, content_id, status, rating, memo)
values
  (
    '00000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'done',
    5,
    '最高に面白かった。'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'doing',
    null,
    'まだ序盤だけど楽しい。'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '33333333-3333-3333-3333-333333333333',
    'done',
    4,
    '何度見ても世界観が強い。配信情報の表示確認用。'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '44444444-4444-4444-4444-444444444444',
    'want',
    null,
    '長編ドラマの詳細表示を確認するためのサンプル。'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '55555555-5555-5555-5555-555555555555',
    'doing',
    4,
    '仕事の参考資料として少しずつ読む。'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '66666666-6666-6666-6666-666666666666',
    'want',
    null,
    null
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '44444444-4444-4444-4444-444444444444',
    'want',
    null,
    '周りが絶賛しているので観たい。'
  );
