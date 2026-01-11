import type { DrinkSuggestion } from '../../../../shared/types';
import { requireAuth } from '../../../_lib/auth';
import { readJson } from '../../../_lib/body';
import { errorJson, json } from '../../../_lib/response';
import { requireEnum, requireNumber, requireString } from '../../../_lib/validate';
import { getIndex, getJson, putJson, pushToIndex } from '../../../_lib/kv';
import { getMemberRole } from '../../../_lib/crew';
import type { Env } from '../../../_lib/auth';

const categories = ['BEER', 'CIDER', 'WINE', 'SPIRITS', 'COCKTAIL', 'OTHER'] as const;

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) {
    return auth;
  }
  const crewId = params.crewId as string;
  const role = await getMemberRole(env.APP_KV, crewId, auth.user.id);
  if (!role) {
    return errorJson('FORBIDDEN', 'Not a crew member', 403);
  }
  const body = await readJson<Partial<DrinkSuggestion>>(request);
  try {
    const suggestionId = crypto.randomUUID();
    const suggestion: DrinkSuggestion = {
      suggestion_id: suggestionId,
      crew_id: crewId,
      created_by_user_id: auth.user.id,
      category: requireEnum(body.category, categories, 'category'),
      name: requireString(body.name, 'name'),
      abv: requireNumber(body.abv, 'abv'),
      default_serving_ml: requireNumber(body.default_serving_ml, 'default_serving_ml'),
      serving_label: requireString(body.serving_label, 'serving_label'),
      emoji: requireString(body.emoji, 'emoji'),
      status: 'PENDING',
      created_at: Date.now()
    };
    await putJson(env.APP_KV, `crew:${crewId}:suggestions:${suggestionId}`, suggestion);
    await pushToIndex(env.APP_KV, `crew:${crewId}:suggestions:index`, suggestionId);
    await pushToIndex(env.APP_KV, `crew:${crewId}:suggestions:pending`, suggestionId);
    return json({ suggestion });
  } catch (error) {
    return errorJson('VALIDATION_ERROR', (error as Error).message, 400);
  }
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) {
    return auth;
  }
  const crewId = params.crewId as string;
  const role = await getMemberRole(env.APP_KV, crewId, auth.user.id);
  if (!role) {
    return errorJson('FORBIDDEN', 'Not a crew member', 403);
  }
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const indexKey = status === 'PENDING' ? `crew:${crewId}:suggestions:pending` : `crew:${crewId}:suggestions:index`;
  const ids = await getIndex(env.APP_KV, indexKey);
  const suggestions = (await Promise.all(ids.map((id) => getJson<DrinkSuggestion>(env.APP_KV, `crew:${crewId}:suggestions:${id}`))))
    .filter((item): item is DrinkSuggestion => Boolean(item))
    .filter((item) => (role === 'ADMIN' ? true : item.created_by_user_id === auth.user.id));
  return json({ suggestions });
};
