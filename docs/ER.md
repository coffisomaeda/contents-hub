# Contents Hub ER 図

## テーブル一覧

| テーブル名       | 説明                                         |
| ---------------- | -------------------------------------------- |
| `profiles`       | ユーザープロファイル（auth.users と 1:1）     |
| `contents`       | コンテンツ共通テーブル（全メディア横断）      |
| `books`          | 書籍固有情報（楽天ブックス書籍検索 API 対応） |
| `games`          | ゲーム固有情報（楽天ブックスゲーム検索 API 対応） |
| `videos`         | 映像作品固有情報（TMDB API 対応）             |
| `video_sources`  | 映像作品の配信情報（Watchmode API 対応）      |
| `user_contents`  | ユーザーとコンテンツの関連                    |

## リレーション

- **contents ↔ books / games / videos（スーパータイプ・サブタイプ）**: 同じ `id` を共有する 1:1 関係。`contents` に共通情報、サブタイプテーブルにメディア固有情報を持つ。1 つの `contents` に対してサブタイプは 1 つだけ存在する（`media_type` で判別）
- **profiles ↔ user_contents ↔ contents（多対多）**: ユーザーがコンテンツを登録すると `user_contents` に行が作られる。ステータス・評価・メモはユーザーごとの個人データ
- **videos ↔ video_sources（1 対多）**: 1 つの映像作品に複数の配信ソース（Netflix, Amazon 等）が紐づく

## ER 図

```mermaid
erDiagram
    profiles {
        uuid id PK
        text display_name
        text avatar_url
        timestamptz created_at
        timestamptz updated_at
    }

    contents {
        uuid id PK
        text media_type
        text title
        text title_kana
        text description
        text image_url
        date release_date
        text item_url
        timestamptz created_at
        timestamptz updated_at
    }

    books {
        uuid id PK
        text isbn
        text author
        text author_kana
        text publisher_name
        integer item_price
        text rakuten_genre_id
        integer review_count
        numeric review_average
    }

    games {
        uuid id PK
        text jan
        text hardware
        text label
        text maker_code
        integer item_price
        text rakuten_genre_id
        integer review_count
        numeric review_average
    }

    videos {
        uuid id PK
        text media_type
        integer tmdb_id
        text original_title
        text poster_path
        text backdrop_path
        jsonb genres
        numeric vote_average
        integer vote_count
        integer runtime
        integer number_of_seasons
        integer number_of_episodes
        text status
        text imdb_id
        integer watchmode_id
    }

    video_sources {
        uuid id PK
        uuid video_id FK
        integer source_id
        text name
        text type
        text region
        text web_url
        text format
        numeric price
        integer seasons
        integer episodes
        timestamptz fetched_at
    }

    user_contents {
        uuid id PK
        uuid user_id FK
        uuid content_id FK
        text status
        integer rating
        text memo
        timestamptz created_at
        timestamptz updated_at
    }

    profiles ||--o{ user_contents : "registers"
    contents ||--o{ user_contents : "tracked by"
    contents ||--o| books : "is a"
    contents ||--o| games : "is a"
    contents ||--o| videos : "is a"
    videos ||--o{ video_sources : "streams on"
```

## ステータス管理

`user_contents.status` は以下の 3 値:

| 値     | 意味                                     |
| ------ | ---------------------------------------- |
| `want` | 気になる・未着手                         |
| `doing`| 進行中（読書中・プレイ中・視聴中）       |
| `done` | 完了（読了・クリア・視聴済み）           |

## マイグレーションファイル

`supabase/migrations/20260429073936_create_tables.sql`
