import type { DrinkProduct } from '../../../../shared/types';
import { requireAuth } from '../../../_lib/auth';
import { readJson } from '../../../_lib/body';
import { errorJson, json } from '../../../_lib/response';
import { requireEnum, requireNumber, requireString } from '../../../_lib/validate';
import { getIndex, getJson, putJson, pushToIndex } from '../../../_lib/kv';
import { requireAdmin } from '../../../_lib/crew';
import type { Env } from '../../../_lib/auth';

const categories = ['BEER', 'CIDER', 'WINE', 'SPIRITS', 'COCKTAIL', 'OTHER'] as const;

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) {
    return auth;
  }
  const crewId = params.crewId as string;
  const index = await getIndex(env.APP_KV, `crew:${crewId}:products:index`);
  const products: DrinkProduct[] = [];
  for (const productId of index) {
    const product = await getJson<DrinkProduct>(env.APP_KV, `crew:${crewId}:products:${productId}`);
    if (product) {
      products.push(product);
    }
  }
  return json({ products });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) {
    return auth;
  }
  const crewId = params.crewId as string;
  const isAdmin = await requireAdmin(env.APP_KV, crewId, auth.user.id);
  if (!isAdmin) {
    return errorJson('FORBIDDEN', 'Admin only', 403);
  }
  const body = await readJson<Partial<DrinkProduct>>(request);
  try {
    const productId = crypto.randomUUID();
    const now = Date.now();
    const product: DrinkProduct = {
      product_id: productId,
      crew_id: crewId,
      category: requireEnum(body.category, categories, 'category'),
      name: requireString(body.name, 'name'),
      abv: requireNumber(body.abv, 'abv'),
      default_serving_ml: requireNumber(body.default_serving_ml, 'default_serving_ml'),
      serving_label: requireString(body.serving_label, 'serving_label'),
      emoji: requireString(body.emoji, 'emoji'),
      is_archived: false,
      created_at: now,
      updated_at: now
    };
    await putJson(env.APP_KV, `crew:${crewId}:products:${productId}`, product);
    await pushToIndex(env.APP_KV, `crew:${crewId}:products:index`, productId);
    return json({ product });
  } catch (error) {
    return errorJson('VALIDATION_ERROR', (error as Error).message, 400);
  }
};
