# TMDB API

映画・TV 番組の情報取得に使用する。

## 基本情報

| 項目           | 値                                                                         |
| -------------- | -------------------------------------------------------------------------- |
| ベース URL     | `https://api.themoviedb.org/3`                                             |
| メソッド       | GET                                                                        |
| レスポンス形式 | JSON                                                                       |
| 認証           | Bearer トークン（Authorization ヘッダー）または `api_key` クエリパラメータ |
| 画像ベース URL | `https://image.tmdb.org/t/p/{size}{file_path}`                             |

## 使用予定エンドポイント

### 映画検索 — `GET /search/movie`

| パラメータ             | 型      | 必須 | デフォルト | 説明                           |
| ---------------------- | ------- | ---- | ---------- | ------------------------------ |
| `query`                | string  | ○    | -          | 検索キーワード                 |
| `language`             | string  | -    | en-US      | 言語（`ja-JP` で日本語取得可） |
| `page`                 | int     | -    | 1          | ページ番号                     |
| `include_adult`        | boolean | -    | false      | アダルト作品を含むか           |
| `region`               | string  | -    | -          | ISO 3166-1 リージョンコード    |
| `year`                 | string  | -    | -          | 公開年で絞り込み               |
| `primary_release_year` | string  | -    | -          | 初公開年で絞り込み             |

レスポンス:

```json
{
  "page": 1,
  "total_results": 39,
  "total_pages": 2,
  "results": [
    {
      "id": 550,
      "title": "Fight Club",
      "original_title": "Fight Club",
      "overview": "...",
      "release_date": "1999-10-15",
      "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      "backdrop_path": "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
      "genre_ids": [18, 53, 35],
      "vote_average": 8.433,
      "vote_count": 26279,
      "popularity": 73.433
    }
  ]
}
```

### TV 番組検索 — `GET /search/tv`

| パラメータ            | 型      | 必須 | デフォルト | 説明                         |
| --------------------- | ------- | ---- | ---------- | ---------------------------- |
| `query`               | string  | ○    | -          | 検索キーワード               |
| `language`            | string  | -    | en-US      | 言語                         |
| `page`                | int     | -    | 1          | ページ番号                   |
| `include_adult`       | boolean | -    | false      | アダルト作品を含むか         |
| `first_air_date_year` | int     | -    | -          | 初回放送年で絞り込み         |
| `year`                | int     | -    | -          | 全エピソード放送日で絞り込み |

レスポンス:

```json
{
  "page": 1,
  "total_results": 1,
  "total_pages": 1,
  "results": [
    {
      "id": 1396,
      "name": "Breaking Bad",
      "original_name": "Breaking Bad",
      "overview": "...",
      "first_air_date": "2008-01-20",
      "poster_path": "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      "backdrop_path": "/bsNm9z2TJfe0WO3RedPGWQ8mG1X.jpg",
      "genre_ids": [18, 80],
      "origin_country": ["US"],
      "vote_average": 8.879
    }
  ]
}
```

### 映画詳細 — `GET /movie/{movie_id}`

| パラメータ           | 型     | 必須 | 説明                                        |
| -------------------- | ------ | ---- | ------------------------------------------- |
| `movie_id`           | int    | ○    | TMDB の映画 ID（パスパラメータ）            |
| `language`           | string | -    | 言語                                        |
| `append_to_response` | string | -    | 追加取得するデータ（カンマ区切り、最大 20） |

主なレスポンスフィールド:

| フィールド                      | 説明                        |
| ------------------------------- | --------------------------- |
| `id`                            | TMDB ID                     |
| `title` / `original_title`      | タイトル / 原題             |
| `overview`                      | 概要                        |
| `release_date`                  | 公開日                      |
| `runtime`                       | 上映時間（分）              |
| `genres`                        | ジャンル配列 `[{id, name}]` |
| `poster_path` / `backdrop_path` | ポスター / 背景画像パス     |
| `vote_average` / `vote_count`   | 評価平均 / 投票数           |
| `imdb_id`                       | IMDB ID                     |
| `production_companies`          | 製作会社                    |
| `status`                        | ステータス（Released 等）   |

### TV 番組詳細 — `GET /tv/{series_id}`

| パラメータ           | 型     | 必須 | 説明                                        |
| -------------------- | ------ | ---- | ------------------------------------------- |
| `series_id`          | int    | ○    | TMDB の TV 番組 ID（パスパラメータ）        |
| `language`           | string | -    | 言語                                        |
| `append_to_response` | string | -    | 追加取得するデータ（カンマ区切り、最大 20） |

主なレスポンスフィールド:

| フィールド                                 | 説明                                       |
| ------------------------------------------ | ------------------------------------------ |
| `id`                                       | TMDB ID                                    |
| `name` / `original_name`                   | 番組名 / 原題                              |
| `overview`                                 | 概要                                       |
| `first_air_date`                           | 初回放送日                                 |
| `number_of_seasons` / `number_of_episodes` | シーズン数 / エピソード数                  |
| `genres`                                   | ジャンル配列                               |
| `poster_path` / `backdrop_path`            | ポスター / 背景画像パス                    |
| `vote_average`                             | 評価平均                                   |
| `networks`                                 | 放送ネットワーク `[{id, name, logo_path}]` |
| `seasons`                                  | シーズン情報配列                           |
| `status`                                   | ステータス（Ended / Returning Series 等）  |
| `created_by`                               | 制作者                                     |

## 画像 URL の組み立て

```
https://image.tmdb.org/t/p/{size}{file_path}
```

size の例: `w92`, `w154`, `w185`, `w342`, `w500`, `w780`, `original`
