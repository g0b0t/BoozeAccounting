import type { Crew, CrewMember } from '../../shared/types';
import { requireAuth } from '../_lib/auth';
import { readJson } from '../_lib/body';
import { errorJson, json } from '../_lib/response';
import { requireString } from '../_lib/validate';
import { getJson, putJson, pushToIndex } from '../_lib/kv';

function randomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) {
    return auth;
  }
  const body = await readJson<{ name?: string }>(request);
  try {
    const name = requireString(body.name, 'name');
    const crewId = crypto.randomUUID();
    const invite_code = randomCode();
    const crew: Crew = {
      crew_id: crewId,
      name,
      owner_user_id: auth.user.id,
      invite_code,
      created_at: Date.now()
    };
    const member: CrewMember = {
      crew_id: crewId,
      user_id: auth.user.id,
      role: 'ADMIN',
      joined_at: Date.now()
    };
    await putJson(env.APP_KV, `crew:${crewId}`, crew);
    await putJson(env.APP_KV, `crew:invite:${invite_code}`, crewId);
    await putJson(env.APP_KV, `crew:${crewId}:members`, [member]);
    await pushToIndex(env.APP_KV, `user:${auth.user.id}:crews`, crewId);
    return json({ crew });
  } catch (error) {
    return errorJson('VALIDATION_ERROR', (error as Error).message, 400);
  }
};

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) {
    return auth;
  }
  const crews = (await getJson<string[]>(env.APP_KV, `user:${auth.user.id}:crews`)) ?? [];
  return json({ crews });
};
