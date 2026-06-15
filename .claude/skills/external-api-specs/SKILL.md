---
name: external-api-specs
description: >
  Contents Hub が利用する外部 API（楽天ブックス書籍検索 / 楽天ブックスゲーム検索 /
  TMDB / Watchmode）のエンドポイント・パラメータ・レスポンス仕様のリファレンス。
  これらの API を呼び出すコードを書く・読む・デバッグするとき、検索や詳細取得・
  配信状況取得の実装を行うとき、パラメータ名やレスポンスフィールド・エラーコード・
  画像 URL の組み立て方を確認したいときに必ず参照すること。
  「楽天 API」「TMDB」「Watchmode」「映画/TV/書籍/ゲームの検索」「配信状況」
  「poster_path」「booksGenreId」などに触れたら、推測で書かずこのスキルを使う。
---

# 外部 API 仕様リファレンス

Contents Hub が連携する外部 API の仕様をまとめたスキル。各 API の詳細は
`references/` に分割してある。**該当する API のファイルだけ**を読み込み、パラメータ名・
レスポンスフィールド・エラーコードを正確に確認してから実装すること（推測で書かない）。

## どのリファレンスを読むか

| 用途                                                      | 読むファイル                  |
| --------------------------------------------------------- | ----------------------------- |
| 書籍の検索・登録（楽天ブックス書籍検索 API）              | `references/rakuten-books.md` |
| ゲームの検索・登録（楽天ブックスゲーム検索 API）          | `references/rakuten-game.md`  |
| 映画・TV 番組の検索 / 詳細 / 画像 URL（TMDB）             | `references/tmdb.md`          |
| 映像作品の配信状況（どのサブスクで観られるか、Watchmode） | `references/watchmode.md`     |

楽天ブックス系（書籍・ゲーム）は認証方式と共通エラーコードが共通。両方を扱うときは
2 ファイルとも参照する。

## メディア種別と API の対応

| メディア  | 検索に使う API         | 補助 API              |
| --------- | ---------------------- | --------------------- |
| 書籍      | 楽天ブックス書籍検索   | -                     |
| ゲーム    | 楽天ブックスゲーム検索 | -                     |
| 映画 / TV | TMDB                   | Watchmode（配信状況） |

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

TMDB の作品 ID をそのまま Watchmode の検索キー（`tmdb_movie_id` / `tmdb_tv_id`）に
使えるため、TMDB → Watchmode の連携が容易。ただし TMDB 形式での照会は Watchmode
クレジットを 2 消費する点に注意（詳細は `references/watchmode.md`）。

## 参考リンク

- [楽天ブックス書籍検索 API](https://webservice.rakuten.co.jp/documentation/books-book-search)
- [楽天ブックスゲーム検索 API](https://webservice.rakuten.co.jp/documentation/books-game-search)
- [TMDB API リファレンス](https://developer.themoviedb.org/reference)
- [Watchmode API ドキュメント](https://api.watchmode.com/docs/)
- [Watchmode npm SDK](https://www.npmjs.com/package/@watchmode/api-client)
