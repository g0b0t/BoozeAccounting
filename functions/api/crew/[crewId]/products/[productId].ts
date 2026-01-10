import type { DrinkProduct } from '../../../../../shared/types';
import { requireAuth } from '../../../../_lib/auth';
import { readJson } from '../../../../_lib/body';
import { errorJson, json } from '../../../../_lib/response';
import { requireEnum, requireNumber, requireString } from '../../../../_lib/validate';
import { getJson, putJson } from '../../../../_lib/kv';
import { requireAdmin } from '../../../../_lib/crew';

const categories = ['BEER', 'CIDER', 'WINE', 'SPIRITS', 'COCKTAIL', 'OTHER'] as const;

export const onRequestPut: PagesFunction = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) {
    return auth;
  }
  const crewId = params.crewId as string;
  const productId = params.productId as string;
  const isAdmin = await requireAdmin(env.APP_KV, crewId, auth.user.id);
  if (!isAdmin) {
    return errorJson('FORBIDDEN', 'Admin only', 403);
  }
  const existing = await getJson<DrinkProduct>(env.APP_KV, `crew:${crewId}:products:${productId}`);
  if (!existing) {
    return errorJson('NOT_FOUND', 'Product not found', 404);
  }
  const body = await readJson<Partial<DrinkProduct>>(request);
  try {
    const updated: DrinkProduct = {
      ...existing,
      category: requireEnum(body.category ?? existing.category, categories, 'category'),
      name: requireString(body.name ?? existing.name, 'name'),
      abv: requireNumber(body.abv ?? existing.abv, 'abv'),
      default_serving_ml: requireNumber(body.default_serving_ml ?? existing.default_serving_ml, 'default_serving_ml'),
      serving_label: requireString(body.serving_label ?? existing.serving_label, 'serving_label'),
      emoji: requireString(body.emoji ?? existing.emoji, 'emoji'),
      updated_at: Date.now()
    };
    await putJson(env.APP_KV, `crew:${crewId}:products:${productId}`, updated);
    return json({ product: updated });
  } catch (error) {
    return errorJson('VALIDATION_ERROR', (error as Error).message, 400);
  }
};
