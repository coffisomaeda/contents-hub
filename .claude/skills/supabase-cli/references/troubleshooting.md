# Supabase CLI トラブルシュート

## Docker 前提

Docker Desktop は必須ではない。Linux では Docker Engine の daemon が起動していれば十分。

```bash
docker info        # 成功すれば daemon は起動済み
```

daemon が起動していない場合は OS 側で起動する:

```bash
sudo systemctl enable --now docker
```

`docker` は daemon に命令を送るクライアントで、daemon 自体を起動するコマンドではない。

## `container name ... is already in use`

前回の `supabase start` の残骸コンテナが残っている。停止してから起動し直す:

```bash
mise run supabase:stop
mise run supabase:start
```

## `failed to resolve reference`

Docker が Supabase 関連イメージの取得に失敗している。まず確認:

```bash
supabase start --debug
docker --version
docker info
```

Docker daemon の再起動、VPN / proxy の見直しで直ることがある。

## `supabase: command not found`

`mise install` を実行して Supabase CLI を入れる。`mise.toml` にバージョンが定義されている
（`supabase = 2.95.6`）。
