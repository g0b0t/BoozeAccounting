import type { DrinkProduct, DrinkSuggestion } from '../../../../../../shared/types';
import { requireAuth } from '../../../../../_lib/auth';
import { errorJson, json } from '../../../../../_lib/response';
import { getJson, putJson, pushToIndex, removeFromIndex } from '../../../../../_lib/kv';
import { requireAdmin } from '../../../../../_lib/crew';

export const onRequestPost: PagesFunction = async ({ request, env, params }) => {
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
  const productId = crypto.randomUUID();
  const now = Date.now();
  const product: DrinkProduct = {
    product_id: productId,
    crew_id: crewId,
    category: suggestion.category,
    name: suggestion.name,
    abv: suggestion.abv,
    default_serving_ml: suggestion.default_serving_ml,
    serving_label: suggestion.serving_label,
    emoji: suggestion.emoji,
    is_archived: false,
    created_at: now,
    updated_at: now
  };
  await putJson(env.APP_KV, `crew:${crewId}:products:${productId}`, product);
  await pushToIndex(env.APP_KV, `crew:${crewId}:products:index`, productId);
  suggestion.status = 'APPROVED';
  suggestion.reviewed_at = now;
  suggestion.reviewed_by = auth.user.id;
  await putJson(env.APP_KV, `crew:${crewId}:suggestions:${suggestionId}`, suggestion);
  await removeFromIndex(env.APP_KV, `crew:${crewId}:suggestions:pending`, suggestionId);
  return json({ product, suggestion });
};
