import type { CrewMember } from '../../../../shared/types';
import { requireAuth } from '../../../_lib/auth';
import { errorJson, json } from '../../../_lib/response';
import { getCrewMembers } from '../../../_lib/crew';
import type { Env } from '../../../_lib/auth';

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) {
    return auth;
  }
  const crewId = params.crewId as string;
  const members = await getCrewMembers(env.APP_KV, crewId);
  const isMember = members.some((member) => member.user_id === auth.user.id);
  if (!isMember) {
    return errorJson('FORBIDDEN', 'Not a crew member', 403);
  }
  return json({ members });
};
