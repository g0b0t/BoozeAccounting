import type { DrinkSuggestion } from '../../../../../../shared/types';
import { requireAuth } from '../../../../../_lib/auth';
import { readJson } from '../../../../../_lib/body';
import { errorJson, json } from '../../../../../_lib/response';
import { getJson, putJson, removeFromIndex } from '../../../../../_lib/kv';
import { requireAdmin } from '../../../../../_lib/crew';
import type { Env } from '../../../../../_lib/auth';

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) {
    return auth;
  }
  const crewId = params.crewId as string;
  const suggestionId = params.suggestionId as string;
  const isAdmin = await requireAdmin(env.APP_KV, crewId, auth.user.id);
  if (!isAdmin) {
    return errorJson('FORBIDDEN', 'Admin only', 403);
  }
  const suggestion = await getJson<DrinkSuggestion>(env.APP_KV, `crew:${crewId}:suggestions:${suggestionId}`);
  if (!suggestion) {
    return errorJson('NOT_FOUND', 'Suggestion not found', 404);
  }
  const body = await readJson<{ admin_note?: string }>(request);
  suggestion.status = 'REJECTED';
  suggestion.reviewed_at = Date.now();
  suggestion.reviewed_by = auth.user.id;
  suggestion.admin_note = body.admin_note;
  await putJson(env.APP_KV, `crew:${crewId}:suggestions:${suggestionId}`, suggestion);
  await removeFromIndex(env.APP_KV, `crew:${crewId}:suggestions:pending`, suggestionId);
  return json({ suggestion });
};
