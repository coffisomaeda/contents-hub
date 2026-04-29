# 外部 API 仕様まとめ

Contents Hub で使用する外部 API のエンドポイント、パラメータ、レスポンスをまとめたドキュメントです。

---

## 1. 楽天ブックス書籍検索 API

書籍情報の検索・取得に使用します。

### 基本情報

| 項目           | 値                                                                     |
| -------------- | ---------------------------------------------------------------------- |
| エンドポイント | `https://openapi.rakuten.co.jp/services/api/BooksBook/Search/20170404` |
| メソッド       | GET                                                                    |
| レスポンス形式 | JSON / XML                                                             |
| 認証           | `applicationId`（必須）+ `accessKey`（必須）                           |
| レート制限     | 短時間の大量アクセスで一時的にブロックされる場合あり                   |

### 主な入力パラメータ

| パラメータ       | 型     | 必須 | デフォルト | 説明                                                                                   |
| ---------------- | ------ | ---- | ---------- | -------------------------------------------------------------------------------------- |
| `applicationId`  | String | ○    | -          | アプリ ID                                                                              |
| `accessKey`      | String | ○    | -          | アクセスキー（ヘッダーまたはクエリ）                                                   |
| `title`          | String | ※1   | -          | 書籍タイトル（UTF-8 URL エンコード、半角スペースで複数指定可）                         |
| `author`         | String | ※1   | -          | 著者名                                                                                 |
| `publisherName`  | String | ※1   | -          | 出版社名                                                                               |
| `isbn`           | String | ※1   | -          | ISBN コード                                                                            |
| `booksGenreId`   | String | ※1   | 001        | 楽天ブックスジャンル ID                                                                |
| `size`           | int    | ※1   | 0          | 書籍サイズ（0:全て, 1:単行本, 2:文庫, 9:コミック 等）                                  |
| `hits`           | int    | -    | 30         | 1 ページあたりの取得件数（1〜30）                                                      |
| `page`           | int    | -    | 1          | 取得ページ（1〜100）                                                                   |
| `sort`           | String | -    | standard   | ソート順（standard / sales / ±releaseDate / ±itemPrice / reviewCount / reviewAverage） |
| `availability`   | int    | -    | 0          | 在庫状況フィルタ                                                                       |
| `outOfStockFlag` | int    | -    | 0          | 品切れ商品の表示（0:除外, 1:含む）                                                     |
| `formatVersion`  | int    | -    | 1          | レスポンス形式バージョン（2 推奨）                                                     |

> ※1: title, author, publisherName, size, isbn, booksGenreId のいずれか 1 つ以上が必須

### 主な出力フィールド

| フィールド                      | 説明                                |
| ------------------------------- | ----------------------------------- |
| `count`                         | 検索結果の総件数                    |
| `page` / `pageCount`            | 現在ページ / 総ページ数（最大 100） |
| `title`                         | 書籍タイトル                        |
| `titleKana`                     | タイトルカナ                        |
| `author` / `authorKana`         | 著者名 / カナ                       |
| `publisherName`                 | 出版社名                            |
| `isbn`                          | ISBN コード                         |
| `itemCaption`                   | 商品説明文                          |
| `salesDate`                     | 発売日（例: 2024年01月15日）        |
| `itemPrice`                     | 税込み販売価格                      |
| `itemUrl`                       | 商品 URL                            |
| `smallImageUrl`                 | 商品画像 64×64                      |
| `mediumImageUrl`                | 商品画像 128×128                    |
| `largeImageUrl`                 | 商品画像 200×200                    |
| `reviewCount` / `reviewAverage` | レビュー件数 / 平均評価             |
| `booksGenreId`                  | 所属ジャンル ID                     |

### レスポンス例（formatVersion=2）

```json
{
  "count": 1,
  "page": 1,
  "hits": 30,
  "pageCount": 1,
  "Items": [
    {
      "title": "書籍タイトル",
      "author": "著者名",
      "isbn": "9784000000000",
      "itemPrice": 1000,
      "largeImageUrl": "https://...",
      "itemUrl": "https://..."
    }
  ]
}
```

---

## 2. 楽天ブックスゲーム検索 API

ゲーム情報の検索・取得に使用します。

### 基本情報

| 項目           | 値                                                                     |
| -------------- | ---------------------------------------------------------------------- |
| エンドポイント | `https://openapi.rakuten.co.jp/services/api/BooksGame/Search/20170404` |
| メソッド       | GET                                                                    |
| レスポンス形式 | JSON / XML                                                             |
| 認証           | `applicationId`（必須）+ `accessKey`（必須）                           |

### 主な入力パラメータ

| パラメータ      | 型     | 必須 | デフォルト | 説明                                                             |
| --------------- | ------ | ---- | ---------- | ---------------------------------------------------------------- |
| `applicationId` | String | ○    | -          | アプリ ID                                                        |
| `accessKey`     | String | ○    | -          | アクセスキー                                                     |
| `title`         | String | ※1   | -          | ゲームタイトル（UTF-8 URL エンコード、半角スペースで複数指定可） |
| `hardware`      | String | ※1   | -          | 対応機種                                                         |
| `label`         | String | ※1   | -          | 発売元名                                                         |
| `makerCode`     | String | ※1   | -          | メーカー品番                                                     |
| `jan`           | long   | ※1   | -          | JAN コード                                                       |
| `booksGenreId`  | String | ※1   | 006        | 楽天ブックスジャンル ID（006 配下のみ）                          |
| `hits`          | int    | -    | 30         | 1 ページあたりの取得件数（1〜30）                                |
| `page`          | int    | -    | 1          | 取得ページ（1〜100）                                             |
| `sort`          | String | -    | standard   | ソート順                                                         |
| `availability`  | int    | -    | 0          | 在庫状況フィルタ                                                 |
| `formatVersion` | int    | -    | 1          | レスポンス形式バージョン（2 推奨）                               |

> ※1: title, hardware, makerCode, label, jan, booksGenreId のいずれか 1 つ以上が必須

### 主な出力フィールド

| フィールド                                           | 説明                         |
| ---------------------------------------------------- | ---------------------------- |
| `title` / `titleKana`                                | ゲームタイトル / カナ        |
| `hardware`                                           | 対応機種                     |
| `label`                                              | 発売元名                     |
| `jan`                                                | JAN コード                   |
| `makerCode`                                          | メーカー品番                 |
| `itemCaption`                                        | 商品説明文                   |
| `salesDate`                                          | 発売日                       |
| `itemPrice`                                          | 税込み販売価格               |
| `itemUrl`                                            | 商品 URL                     |
| `smallImageUrl` / `mediumImageUrl` / `largeImageUrl` | 商品画像（64 / 128 / 200px） |
| `reviewCount` / `reviewAverage`                      | レビュー件数 / 平均評価      |
| `booksGenreId`                                       | 所属ジャンル ID              |

### 共通エラーコード（楽天ブックス API 共通）

| HTTP ステータス | 意味                                     |
| --------------- | ---------------------------------------- |
| 400             | パラメータエラー（必須パラメータ不足等） |
| 404             | データが見つからない                     |
| 429             | リクエスト過多（時間をおいて再試行）     |
| 500             | 楽天側の内部エラー                       |
| 503             | メンテナンス中                           |

---

## 3. TMDB API

映画・TV 番組の情報取得に使用します。

### 基本情報

| 項目           | 値                                                                         |
| -------------- | -------------------------------------------------------------------------- |
| ベース URL     | `https://api.themoviedb.org/3`                                             |
| メソッド       | GET                                                                        |
| レスポンス形式 | JSON                                                                       |
| 認証           | Bearer トークン（Authorization ヘッダー）または `api_key` クエリパラメータ |
| 画像ベース URL | `https://image.tmdb.org/t/p/{size}{file_path}`                             |

### 使用予定エンドポイント

#### 3-1. 映画検索

`GET /search/movie`

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

#### 3-2. TV 番組検索

`GET /search/tv`

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

#### 3-3. 映画詳細

`GET /movie/{movie_id}`

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

#### 3-4. TV 番組詳細

`GET /tv/{series_id}`

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

### TMDB 画像 URL の組み立て

```
https://image.tmdb.org/t/p/{size}{file_path}
```

size の例: `w92`, `w154`, `w185`, `w342`, `w500`, `w780`, `original`

---

## 4. Watchmode API

映像作品の配信状況（どのサブスクで視聴できるか）の取得に使用します。

### 基本情報

| 項目           | 値                                                            |
| -------------- | ------------------------------------------------------------- |
| ベース URL     | `https://api.watchmode.com/v1`                                |
| メソッド       | GET                                                           |
| レスポンス形式 | JSON                                                          |
| 認証           | `apiKey` クエリパラメータ                                     |
| 無料枠         | 月 2,500 リクエスト（3 カ国まで）                             |
| レート制限     | ヘッダー `X-RateLimit-Limit` / `X-RateLimit-Remaining` で確認 |
| 公式 SDK       | `@watchmode/api-client`（npm）                                |

### 使用予定エンドポイント

#### 4-1. タイトル検索

`GET /search`

| パラメータ     | 型     | 必須 | 説明                                                                  |
| -------------- | ------ | ---- | --------------------------------------------------------------------- |
| `search_field` | string | ○    | 検索フィールド（`name` / `imdb_id` / `tmdb_movie_id` / `tmdb_tv_id`） |
| `search_value` | string | ○    | 検索値                                                                |
| `types`        | string | -    | 結果タイプ絞り込み（`tv,movie,person`）                               |

レスポンス:

```json
{
  "title_results": [
    {
      "id": 3173903,
      "name": "Breaking Bad",
      "type": "tv_series",
      "year": 2008,
      "imdb_id": "tt0903747",
      "tmdb_id": 1396,
      "tmdb_type": "tv"
    }
  ],
  "people_results": []
}
```

> TMDB ID での検索が可能なため、TMDB → Watchmode の連携が容易

#### 4-2. オートコンプリート検索

`GET /autocomplete-search`

| パラメータ     | 型     | 必須 | 説明                                                          |
| -------------- | ------ | ---- | ------------------------------------------------------------- |
| `search_value` | string | ○    | 検索語（部分一致可）                                          |
| `search_type`  | int    | -    | 1:全て / 2:タイトルのみ / 3:映画のみ / 4:TV のみ / 5:人物のみ |

#### 4-3. タイトル詳細

`GET /title/{title_id}/details`

| パラメータ           | 型     | 必須 | 説明                                                          |
| -------------------- | ------ | ---- | ------------------------------------------------------------- |
| `title_id`           | string | ○    | Watchmode ID / IMDB ID / TMDB 形式（`movie-278` / `tv-1396`） |
| `append_to_response` | string | -    | 追加データ（`sources`, `cast-crew`, `seasons`, `episodes`）   |
| `language`           | string | -    | 言語コード（デフォルト `en`）                                 |
| `regions`            | string | -    | リージョン絞り込み                                            |

主なレスポンスフィールド:

| フィールド                          | 説明                                            |
| ----------------------------------- | ----------------------------------------------- |
| `id`                                | Watchmode ID                                    |
| `title` / `original_title`          | タイトル / 原題                                 |
| `type`                              | `movie` / `tv_series` / `tv_special` 等         |
| `plot_overview`                     | あらすじ                                        |
| `year` / `end_year`                 | 公開年 / 終了年（TV）                           |
| `runtime_minutes`                   | 上映時間（分）                                  |
| `imdb_id` / `tmdb_id` / `tmdb_type` | 外部 ID マッピング                              |
| `genre_names`                       | ジャンル名配列                                  |
| `user_rating` / `critic_score`      | ユーザー評価 / 批評家スコア                     |
| `poster` / `backdrop`               | ポスター / 背景画像 URL                         |
| `trailer`                           | YouTube トレーラー URL                          |
| `networks` / `network_names`        | ネットワーク（TV）                              |
| `sources`                           | 配信情報配列（`append_to_response=sources` 時） |

#### 4-4. タイトル配信情報

`GET /title/{title_id}/sources`

| パラメータ | 型     | 必須 | 説明                               |
| ---------- | ------ | ---- | ---------------------------------- |
| `title_id` | string | ○    | Watchmode ID / IMDB ID / TMDB 形式 |
| `regions`  | string | -    | リージョン絞り込み（例: `JP`）     |

レスポンス:

```json
[
  {
    "source_id": 203,
    "name": "Netflix",
    "type": "sub",
    "region": "US",
    "web_url": "https://www.netflix.com/title/123456",
    "format": "HD",
    "price": null,
    "seasons": 5,
    "episodes": 62
  }
]
```

| `type` の値 | 意味                                    |
| ----------- | --------------------------------------- |
| `sub`       | サブスクリプション（Netflix, Hulu 等）  |
| `rent`      | レンタル                                |
| `buy`       | 購入                                    |
| `free`      | 無料（広告付き）                        |
| `tve`       | TV チャンネルアプリ（ケーブル契約必要） |

#### 4-5. ストリーミングソース一覧

`GET /sources`

| パラメータ | 型     | 必須 | 説明                                               |
| ---------- | ------ | ---- | -------------------------------------------------- |
| `regions`  | string | -    | リージョン絞り込み（例: `JP`）                     |
| `types`    | string | -    | タイプ絞り込み（`sub`, `purchase`, `free`, `tve`） |

マスタデータ取得用。起動時にキャッシュして利用する想定。

### Watchmode エラーコード

| HTTP ステータス | 意味                       |
| --------------- | -------------------------- |
| 400             | リクエストパラメータ不正   |
| 401             | API キーが無効または未指定 |
| 404             | リソースが見つからない     |

### Watchmode API クレジット消費

| ID 形式                         | コスト        |
| ------------------------------- | ------------- |
| Watchmode ID                    | 1 クレジット  |
| IMDB ID                         | 2 クレジット  |
| TMDB 形式                       | 2 クレジット  |
| `append_to_response` 1 項目追加 | +1 クレジット |

---

## API 連携フロー（想定）

```
[ユーザー入力: タイトル検索]
        │
        ├─ 本 / ゲーム → 楽天ブックス API で検索
        │                  └─ 候補一覧 → 選択 → 登録
        │
        └─ 映像作品 → TMDB API で検索
                       └─ 候補一覧 → 選択
                              │
                              └─ Watchmode API で配信状況取得
                                 （TMDB ID → Watchmode 検索 → sources 取得）
                                 └─ 作品情報 + 配信情報を登録
```

---

## 参考リンク

- [楽天ブックス書籍検索 API](https://webservice.rakuten.co.jp/documentation/books-book-search)
- [楽天ブックスゲーム検索 API](https://webservice.rakuten.co.jp/documentation/books-game-search)
- [TMDB API リファレンス](https://developer.themoviedb.org/reference)
- [Watchmode API ドキュメント](https://api.watchmode.com/docs/)
- [Watchmode npm SDK](https://www.npmjs.com/package/@watchmode/api-client)
