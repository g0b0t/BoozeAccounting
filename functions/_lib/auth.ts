import { verifyTelegramInitData, parseInitData } from '../../shared/telegram';
import type { User } from '../../shared/types';
import { errorJson } from './response';

export interface Env {
  APP_KV: KVNamespace;
  TELEGRAM_BOT_TOKEN: string;
}

export interface AuthContext {
  user: User;
  initData: string;
}

export async function requireAuth(request: Request, env: Env): Promise<AuthContext | Response> {
  const header = request.headers.get('Authorization');
  const initHeader = request.headers.get('X-Telegram-InitData');
  const initData = header?.startsWith('tma ') ? header.slice(4) : initHeader;
  if (!initData) {
    return errorJson('AUTH_REQUIRED', 'Missing Telegram initData', 401);
  }
  if (!verifyTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN)) {
    return errorJson('AUTH_INVALID', 'Invalid Telegram initData', 401);
  }
  const data = parseInitData(initData);
  const tgUser = data.user ? JSON.parse(data.user) : null;
  if (!tgUser?.id) {
    return errorJson('AUTH_INVALID', 'Missing Telegram user', 401);
  }
  const userId = `tg:${tgUser.id}`;
  const key = `user:${userId}`;
  const now = Date.now();
  let user = await env.APP_KV.get<User>(key, 'json');
  if (!user) {
    user = {
      id: userId,
      telegram_user_id: tgUser.id,
      username: tgUser.username,
      first_name: tgUser.first_name,
      photo_url: tgUser.photo_url,
      created_at: now,
      last_seen_at: now
    };
    await env.APP_KV.put(key, JSON.stringify(user));
  } else {
    user.last_seen_at = now;
    await env.APP_KV.put(key, JSON.stringify(user));
  }
  return { user, initData };
}
