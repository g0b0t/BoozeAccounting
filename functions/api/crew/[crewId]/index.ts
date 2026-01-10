import type { Crew } from '../../../../shared/types';
import { requireAuth } from '../../../_lib/auth';
import { errorJson, json } from '../../../_lib/response';
import { getMemberRole } from '../../../_lib/crew';

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
  const crew = await env.APP_KV.get<Crew>(`crew:${crewId}`, 'json');
  if (!crew) {
    return errorJson('NOT_FOUND', 'Crew not found', 404);
  }
  return json({ crew, role });
};
