import { z } from 'zod';

/**
 * 安全なリダイレクト先URLを検証するためのZodスキーマ
 *
 * 指摘事項 (Open Redirect):
 * - / で始まる相対パスであること
 * - // で始まるプロトコル相対URLではないこと
 * - /\ で始まる回避パターン（WHATWG URL正規化を利用したバイパス）ではないこと
 */
export const redirectSchema = z
  .string()
  .startsWith('/')
  .refine((val) => !val.startsWith('//') && !val.startsWith('/\\'), {
    message: 'Invalid redirect path: potential open redirect bypass detected',
  });

/**
 * 渡されたURLが安全な（自サイト内の）相対パスであればそのURLを、
 * 不正な形式であればデフォルトのパス（/）を返します。
 */
export function getSafeRedirect(url: string | null | undefined, defaultPath = '/'): string {
  if (!url) return defaultPath;

  const result = redirectSchema.safeParse(url);
  return result.success ? result.data : defaultPath;
}
