-- ユーザーの「現在アクティブなチャットセッション」を指すポインタ。
-- conversation_id がセッションの単位（chat_messages.conversation_id と対応）。
-- 「クリア」＝新しいセッションへ切り替えるだけで、過去のメッセージは
-- 会話単位で chat_messages に残す（将来のセッション一覧表示に利用する）。
CREATE TABLE IF NOT EXISTS chat_active_sessions (
  user_id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  -- セッションを切り替えた時刻（Unix エポックミリ秒）。
  updated_at INTEGER NOT NULL
);
