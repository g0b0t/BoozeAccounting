import type { DrinkProduct } from '../../../../../../shared/types';
import { requireAuth } from '../../../../../_lib/auth';
import { errorJson, json } from '../../../../../_lib/response';
import { getJson, putJson } from '../../../../../_lib/kv';
import { requireAdmin } from '../../../../../_lib/crew';
import type { Env } from '../../../../../_lib/auth';

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
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
  const product = await getJson<DrinkProduct>(env.APP_KV, `crew:${crewId}:products:${productId}`);
  if (!product) {
    return errorJson('NOT_FOUND', 'Product not found', 404);
  }
  product.is_archived = true;
  product.updated_at = Date.now();
  await putJson(env.APP_KV, `crew:${crewId}:products:${productId}`, product);
  return json({ product });
};
