// promptfoo の javascript assertion。
// モデルが「期待したツールを、期待した引数で」呼び出したかを検証する。
// 各テストの vars.expected に { tool, args } を入れておく。
//   tool: 期待するツール名（必須）
//   args: 一致を要求する引数のサブセット（任意。例 { status: 'done', rating: 5 }）
//
// 自然文になりがちな query は完全一致を求めず、「空でないこと」だけ確認する。

/**
 * promptfoo の output（ツール呼び出し）を [{ name, args }] に正規化する。
 * provider やモデルによって string / 配列 / OpenAI 形式と揺れるため吸収する。
 */
function normalizeToolCalls(output) {
  let value = output;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) return [];
    try {
      value = JSON.parse(trimmed);
    } catch {
      return [];
    }
  }
  const list = Array.isArray(value) ? value : [value];
  const calls = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    // OpenAI 形式: { type:'function', function:{ name, arguments } }
    const fn = item.function ?? item;
    const name = fn.name;
    if (!name) continue;
    let args = fn.arguments ?? fn.args ?? fn.input ?? {};
    if (typeof args === 'string') {
      try {
        args = JSON.parse(args);
      } catch {
        args = {};
      }
    }
    calls.push({ name, args: args ?? {} });
  }
  return calls;
}

export default function (output, context) {
  const expected = context?.vars?.expected;
  if (!expected || !expected.tool) {
    return { pass: false, score: 0, reason: 'テスト定義に expected.tool がありません。' };
  }

  const calls = normalizeToolCalls(output);
  if (calls.length === 0) {
    return {
      pass: false,
      score: 0,
      reason: `ツール呼び出しが検出されませんでした（期待: ${expected.tool}）。`,
    };
  }

  const match = calls.find((c) => c.name === expected.tool);
  if (!match) {
    return {
      pass: false,
      score: 0,
      reason: `期待したツール ${expected.tool} が呼ばれていません（実際: ${calls
        .map((c) => c.name)
        .join(', ')}）。`,
    };
  }

  // query は存在チェックのみ（自然文の揺れを許容）
  if ('query' in (match.args ?? {}) && !String(match.args.query ?? '').trim()) {
    return { pass: false, score: 0, reason: 'query が空です。' };
  }

  // 期待した引数のサブセット一致を検証。
  // 数値系（rating 等）はアプリ側が z.coerce.number() で矯正するため、
  // "5" と 5 を同一とみなす（文字列化して比較）。
  const want = expected.args ?? {};
  for (const [key, wantVal] of Object.entries(want)) {
    const gotVal = match.args?.[key];
    if (String(gotVal) !== String(wantVal)) {
      return {
        pass: false,
        score: 0,
        reason: `引数 ${key} が一致しません（期待: ${JSON.stringify(wantVal)} / 実際: ${JSON.stringify(gotVal)}）。`,
      };
    }
  }

  return { pass: true, score: 1, reason: `OK: ${expected.tool} を正しく呼び出しました。` };
}
