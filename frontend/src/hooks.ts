import type { Reroute } from '@sveltejs/kit';

// / → /contents をサーバー内部で解決し、302 リダイレクトを排除する。
// ブラウザの URL は / のまま、/contents のルートが描画される。
export const reroute: Reroute = ({ url }) => {
  if (url.pathname === '/') {
    return '/contents';
  }
};
