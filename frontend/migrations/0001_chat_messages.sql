-- チャット履歴を保存する D1 テーブル。
-- 1 行 = 1 発言（ユーザー or アシスタント）。conversation_id で 1 回の会話をまとめる。
-- user_id は Supabase の auth.users.id（UUID 文字列）。
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  -- アシスタント発言で登録が発生した場合の付随情報（JSON 文字列）。それ以外は NULL。
  registered_content TEXT,
  -- 作成時刻（Unix エポックミリ秒）。
  created_at INTEGER NOT NULL
);

-- ユーザーごとの時系列閲覧用。
CREATE INDEX IF NOT EXISTS idx_chat_messages_user
  ON chat_messages (user_id, created_at);

-- 会話単位での閲覧用。
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
  ON chat_messages (conversation_id, created_at);
