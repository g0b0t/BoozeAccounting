import type { Session } from '../../../../../shared/types';
import { requireAuth } from '../../../../_lib/auth';
import { readJson } from '../../../../_lib/body';
import { errorJson, json } from '../../../../_lib/response';
import { requireString } from '../../../../_lib/validate';
import { getMemberRole } from '../../../../_lib/crew';
import { getIndex, putJson, pushToIndex } from '../../../../_lib/kv';

export const onRequestPost: PagesFunction = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) {
    return auth;
  }
  const crewId = params.crewId as string;
  const role = await getMemberRole(env.APP_KV, crewId, auth.user.id);
  if (!role) {
    return errorJson('FORBIDDEN', 'Not a crew member', 403);
  }
  const body = await readJson<{ title?: string }>(request);
  try {
    const title = requireString(body.title ?? 'Session', 'title');
    const activeIndex = await getIndex(env.APP_KV, `crew:${crewId}:sessions:active`);
    if (activeIndex.length > 0) {
      const active = await env.APP_KV.get<Session>(`crew:${crewId}:sessions:${activeIndex[0]}`, 'json');
      if (active && !active.ended_at) {
        return json({ session: active });
      }
    }
    const sessionId = crypto.randomUUID();
    const session: Session = {
      session_id: sessionId,
      crew_id: crewId,
      title,
      started_at: Date.now(),
      created_by: auth.user.id
    };
    await putJson(env.APP_KV, `crew:${crewId}:sessions:${sessionId}`, session);
    await pushToIndex(env.APP_KV, `crew:${crewId}:sessions:index`, sessionId);
    await putJson(env.APP_KV, `crew:${crewId}:sessions:active`, [sessionId]);
    return json({ session });
  } catch (error) {
    return errorJson('VALIDATION_ERROR', (error as Error).message, 400);
  }
};
