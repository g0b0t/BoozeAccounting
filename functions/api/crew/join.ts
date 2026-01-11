import type { Crew, CrewMember } from '../../../shared/types';
import { requireAuth } from '../../_lib/auth';
import { readJson } from '../../_lib/body';
import { errorJson, json } from '../../_lib/response';
import { requireString } from '../../_lib/validate';
import { getJson, putJson, pushToIndex } from '../../_lib/kv';
import { getCrewMembers } from '../../_lib/crew';
import type { Env } from '../../_lib/auth';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) {
    return auth;
  }
  const body = await readJson<{ invite_code?: string }>(request);
  try {
    const inviteCode = requireString(body.invite_code, 'invite_code').toUpperCase();
    const crewId = await getJson<string>(env.APP_KV, `crew:invite:${inviteCode}`);
    if (!crewId) {
      return errorJson('NOT_FOUND', 'Invite code not found', 404);
    }
    const crew = await getJson<Crew>(env.APP_KV, `crew:${crewId}`);
    if (!crew) {
      return errorJson('NOT_FOUND', 'Crew not found', 404);
    }
    const members = await getCrewMembers(env.APP_KV, crewId);
    if (!members.find((m) => m.user_id === auth.user.id)) {
      const member: CrewMember = {
        crew_id: crewId,
        user_id: auth.user.id,
        role: 'MEMBER',
        joined_at: Date.now()
      };
      await putJson(env.APP_KV, `crew:${crewId}:members`, [...members, member]);
      await pushToIndex(env.APP_KV, `user:${auth.user.id}:crews`, crewId);
    }
    return json({ crew });
  } catch (error) {
    return errorJson('VALIDATION_ERROR', (error as Error).message, 400);
  }
};
