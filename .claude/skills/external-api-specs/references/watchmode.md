# Watchmode API

映像作品の配信状況（どのサブスクで視聴できるか）の取得に使用する。

## 基本情報

| 項目           | 値                                                            |
| -------------- | ------------------------------------------------------------- |
| ベース URL     | `https://api.watchmode.com/v1`                                |
| メソッド       | GET                                                           |
| レスポンス形式 | JSON                                                          |
| 認証           | `apiKey` クエリパラメータ                                     |
| 無料枠         | 月 2,500 リクエスト（3 カ国まで）                             |
| レート制限     | ヘッダー `X-RateLimit-Limit` / `X-RateLimit-Remaining` で確認 |
| 公式 SDK       | `@watchmode/api-client`（npm）                                |

## 使用予定エンドポイント

### タイトル検索 — `GET /search`

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

> TMDB ID での検索が可能なため、TMDB → Watchmode の連携が容易。

### オートコンプリート検索 — `GET /autocomplete-search`

| パラメータ     | 型     | 必須 | 説明                                                          |
| -------------- | ------ | ---- | ------------------------------------------------------------- |
| `search_value` | string | ○    | 検索語（部分一致可）                                          |
| `search_type`  | int    | -    | 1:全て / 2:タイトルのみ / 3:映画のみ / 4:TV のみ / 5:人物のみ |

### タイトル詳細 — `GET /title/{title_id}/details`

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

### タイトル配信情報 — `GET /title/{title_id}/sources`

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

### ストリーミングソース一覧 — `GET /sources`

| パラメータ | 型     | 必須 | 説明                                               |
| ---------- | ------ | ---- | -------------------------------------------------- |
| `regions`  | string | -    | リージョン絞り込み（例: `JP`）                     |
| `types`    | string | -    | タイプ絞り込み（`sub`, `purchase`, `free`, `tve`） |

マスタデータ取得用。起動時にキャッシュして利用する想定。

## エラーコード

| HTTP ステータス | 意味                       |
| --------------- | -------------------------- |
| 400             | リクエストパラメータ不正   |
| 401             | API キーが無効または未指定 |
| 404             | リソースが見つからない     |

## API クレジット消費

| ID 形式                         | コスト        |
| ------------------------------- | ------------- |
| Watchmode ID                    | 1 クレジット  |
| IMDB ID                         | 2 クレジット  |
| TMDB 形式                       | 2 クレジット  |
| `append_to_response` 1 項目追加 | +1 クレジット |

Watchmode ID で照会するのが最も安い。TMDB 形式・IMDB ID は 2 クレジット消費するため、
一度 Watchmode ID を取得したら以降はそれを使い回すとクレジットを節約できる。
