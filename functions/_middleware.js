export async function onRequest(context) {
  // 設定したユーザー名とパスワード
  const USER = 'guest';
  const PASS = 'oxy001';

  // 認証ヘッダーの取得
  const authHeader = context.request.headers.get('Authorization');

  if (authHeader) {
    const match = authHeader.match(/^Basic\s+(.*)$/);
    if (match) {
      // Base64デコード
      const [user, pass] = atob(match[1]).split(':');
      if (user === USER && pass === PASS) {
        // 認証成功：そのままページを表示
        return context.next();
      }
    }
  }

  // 認証失敗、または未認証：パスワード入力画面をブラウザに要求する
  return new Response('認証が必要です。', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Oxygen Calculator Secure Area"',
    },
  });
}
