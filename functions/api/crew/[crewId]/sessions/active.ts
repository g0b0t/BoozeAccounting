import type { Session } from '../../../../../shared/types';
import { requireAuth } from '../../../../_lib/auth';
import { errorJson, json } from '../../../../_lib/response';
import { getIndex } from '../../../../_lib/kv';
import { getMemberRole } from '../../../../_lib/crew';

export const onRequestGet: PagesFunction = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) {
    return auth;
  }
  const crewId = params.crewId as string;
  const role = await getMemberRole(env.APP_KV, crewId, auth.user.id);
  if (!role) {
    return errorJson('FORBIDDEN', 'Not a crew member', 403);
  }
  const activeIndex = await getIndex(env.APP_KV, `crew:${crewId}:sessions:active`);
  if (activeIndex.length === 0) {
    return json({ session: null });
  }
  const session = await env.APP_KV.get<Session>(`crew:${crewId}:sessions:${activeIndex[0]}`, 'json');
  return json({ session: session ?? null });
};
