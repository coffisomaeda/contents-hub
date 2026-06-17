# 楽天ブックスゲーム検索 API

ゲーム情報の検索・取得に使用する。認証方式・共通エラーコードは
[`rakuten-books.md`](./rakuten-books.md) の楽天ブックス書籍検索 API と共通。

## 基本情報

| 項目           | 値                                                                     |
| -------------- | ---------------------------------------------------------------------- |
| エンドポイント | `https://openapi.rakuten.co.jp/services/api/BooksGame/Search/20170404` |
| メソッド       | GET                                                                    |
| レスポンス形式 | JSON / XML                                                             |
| 認証           | `applicationId`（必須）+ `accessKey`（必須）                           |

## 主な入力パラメータ

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

## 主な出力フィールド

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

## 共通エラーコード（楽天ブックス API 共通）

| HTTP ステータス | 意味                                     |
| --------------- | ---------------------------------------- |
| 400             | パラメータエラー（必須パラメータ不足等） |
| 404             | データが見つからない                     |
| 429             | リクエスト過多（時間をおいて再試行）     |
| 500             | 楽天側の内部エラー                       |
| 503             | メンテナンス中                           |
