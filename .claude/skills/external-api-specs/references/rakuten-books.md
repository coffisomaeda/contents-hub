# 楽天ブックス書籍検索 API

書籍情報の検索・取得に使用する。

## 基本情報

| 項目           | 値                                                                     |
| -------------- | ---------------------------------------------------------------------- |
| エンドポイント | `https://openapi.rakuten.co.jp/services/api/BooksBook/Search/20170404` |
| メソッド       | GET                                                                    |
| レスポンス形式 | JSON / XML                                                             |
| 認証           | `applicationId`（必須）+ `accessKey`（必須）                           |
| レート制限     | 短時間の大量アクセスで一時的にブロックされる場合あり                   |

## 主な入力パラメータ

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

## 主な出力フィールド

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

## レスポンス例（formatVersion=2）

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

## 共通エラーコード（楽天ブックス API 共通）

| HTTP ステータス | 意味                                     |
| --------------- | ---------------------------------------- |
| 400             | パラメータエラー（必須パラメータ不足等） |
| 404             | データが見つからない                     |
| 429             | リクエスト過多（時間をおいて再試行）     |
| 500             | 楽天側の内部エラー                       |
| 503             | メンテナンス中                           |
