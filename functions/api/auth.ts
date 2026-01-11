import { parseInitData, verifyTelegramInitData } from '../../shared/telegram';
import type { Crew, User } from '../../shared/types';
import { errorJson, json } from '../_lib/response';
import { readJson } from '../_lib/body';
import { getJson, putJson } from '../_lib/kv';
import type { Env } from '../_lib/auth';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const header = request.headers.get('Authorization');
  const initHeader = request.headers.get('X-Telegram-InitData');
  const body = await readJson<{ initData?: string }>(request);
  const initData = body.initData ?? (header?.startsWith('tma ') ? header.slice(4) : initHeader) ?? '';
  if (!initData) {
    return errorJson('AUTH_REQUIRED', 'Missing initData', 401);
  }
  if (!(await verifyTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN))) {
    return errorJson('AUTH_INVALID', 'Invalid initData', 401);
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
  } else {
    user.last_seen_at = now;
  }
  await env.APP_KV.put(key, JSON.stringify(user));
  const profile = await env.APP_KV.get(`profile:${userId}`, 'json');
  const crewIndex = (await getJson<string[]>(env.APP_KV, `user:${userId}:crews`)) ?? [];
  const crews: Crew[] = [];
  for (const crewId of crewIndex) {
    const crew = await env.APP_KV.get<Crew>(`crew:${crewId}`, 'json');
    if (crew) {
      crews.push(crew);
    }
  }
  return json({ user, hasProfile: Boolean(profile), crews });
};
