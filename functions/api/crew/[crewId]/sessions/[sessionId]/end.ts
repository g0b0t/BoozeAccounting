import type { Session } from '../../../../../../shared/types';
import { requireAuth } from '../../../../../_lib/auth';
import { errorJson, json } from '../../../../../_lib/response';
import { getJson, putJson } from '../../../../../_lib/kv';
import { getMemberRole } from '../../../../../_lib/crew';

export const onRequestPost: PagesFunction = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) {
    return auth;
  }
  const crewId = params.crewId as string;
  const sessionId = params.sessionId as string;
  const role = await getMemberRole(env.APP_KV, crewId, auth.user.id);
  if (!role) {
    return errorJson('FORBIDDEN', 'Not a crew member', 403);
  }
  const session = await getJson<Session>(env.APP_KV, `crew:${crewId}:sessions:${sessionId}`);
  if (!session) {
    return errorJson('NOT_FOUND', 'Session not found', 404);
  }
  session.ended_at = Date.now();
  await putJson(env.APP_KV, `crew:${crewId}:sessions:${sessionId}`, session);
  await putJson(env.APP_KV, `crew:${crewId}:sessions:active`, []);
  return json({ session });
};
