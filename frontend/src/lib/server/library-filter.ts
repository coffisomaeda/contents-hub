// 登録済みライブラリ（user_contents + contents）に対する絞り込み条件を
// 一箇所で組み立てる。一覧ページ（contents/+page.server.ts）と
// チャットツール（api/chat の search_my_library）で同じ意味論を共有する。

// 登録日（created_at, timestamptz）の範囲指定で、開始日は 00:00、終了日は
// その日いっぱいを含めるための境界。
const DAY_START = 'T00:00:00';
const DAY_END = 'T23:59:59.999';

// 'YYYY-MM-DD' 形式かどうか。
export const isDateString = (value: string | null | undefined): value is string =>
  !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);

// ilike のワイルドカード（% _ \）をエスケープする。
const escapeLikePattern = (value: string) => value.replace(/[%_\\]/g, '\\$&');

export interface LibraryFilters {
  title?: string | null;
  mediaType?: string | null;
  status?: string | null;
  from?: string | null;
  to?: string | null;
}

// Supabase の PostgrestFilterBuilder が満たす最小インターフェース。
// select の形やテーブル行型に依存せず、両呼び出し元のクエリに適用できる。
interface LibraryFilterableQuery<Q> {
  ilike(column: string, pattern: string): Q;
  eq(column: string, value: string): Q;
  gte(column: string, value: string): Q;
  lte(column: string, value: string): Q;
}

// user_contents（contents を inner join 済み）のクエリにフィルタを適用する。
export const applyLibraryFilters = <Q extends LibraryFilterableQuery<Q>>(
  query: Q,
  filters: LibraryFilters,
): Q => {
  let q = query;

  const title = filters.title?.trim();
  if (title) {
    q = q.ilike('contents.title', `%${escapeLikePattern(title)}%`);
  }
  if (filters.mediaType) {
    q = q.eq('contents.media_type', filters.mediaType);
  }
  if (filters.status) {
    q = q.eq('status', filters.status);
  }
  if (isDateString(filters.from)) {
    q = q.gte('created_at', `${filters.from}${DAY_START}`);
  }
  if (isDateString(filters.to)) {
    q = q.lte('created_at', `${filters.to}${DAY_END}`);
  }

  return q;
};
