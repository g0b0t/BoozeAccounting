import type { DrinkEntry } from '../../../../../shared/types';
import { requireAuth } from '../../../../_lib/auth';
import { errorJson, json } from '../../../../_lib/response';
import { getIndex, getJson, removeFromIndex } from '../../../../_lib/kv';
import type { Env } from '../../../../_lib/auth';

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) {
    return auth;
  }
  const crewId = params.crewId as string;
  const index = await getIndex(env.APP_KV, `crew:${crewId}:entries:index`);
  for (const entryId of index) {
    const entry = await getJson<DrinkEntry>(env.APP_KV, `crew:${crewId}:entries:${entryId}`);
    if (entry && entry.user_id === auth.user.id) {
      await env.APP_KV.delete(`crew:${crewId}:entries:${entryId}`);
      await removeFromIndex(env.APP_KV, `crew:${crewId}:entries:index`, entryId);
      return json({ entry_id: entryId });
    }
  }
  return errorJson('NOT_FOUND', 'No entry to undo', 404);
};
