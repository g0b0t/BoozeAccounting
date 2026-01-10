import type { DrinkEntry, DrinkProduct, SummaryResponse, UserProfile } from '../../../../shared/types';
import { requireAuth } from '../../../_lib/auth';
import { errorJson, json } from '../../../_lib/response';
import { getIndex, getJson } from '../../../_lib/kv';
import { calculatePromille, modeForPromille } from '../../../../shared/promille';
import { getMemberRole } from '../../../_lib/crew';

const DISCLAIMER = 'Оценка примерная и не является медицинским прибором. Не используйте как доказательство трезвости.';

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
  const profile = await getJson<UserProfile>(env.APP_KV, `profile:${auth.user.id}`);
  if (!profile) {
    return errorJson('PROFILE_REQUIRED', 'Profile required', 412);
  }
  const entriesIndex = await getIndex(env.APP_KV, `crew:${crewId}:entries:index`);
  const entries = (await Promise.all(entriesIndex.map((id) => getJson<DrinkEntry>(env.APP_KV, `crew:${crewId}:entries:${id}`)))).filter(
    (entry): entry is DrinkEntry => Boolean(entry)
  );
  const productsIndex = await getIndex(env.APP_KV, `crew:${crewId}:products:index`);
  const products = (await Promise.all(productsIndex.map((id) => getJson<DrinkProduct>(env.APP_KV, `crew:${crewId}:products:${id}`))))
    .filter((product): product is DrinkProduct => Boolean(product));
  const productsById = Object.fromEntries(products.map((product) => [product.product_id, product]));
  const now = Date.now();
  const activeIndex = await getIndex(env.APP_KV, `crew:${crewId}:sessions:active`);
  let windowStart = now - 12 * 60 * 60 * 1000;
  if (activeIndex.length > 0) {
    const active = await getJson<{ started_at: number }>(env.APP_KV, `crew:${crewId}:sessions:${activeIndex[0]}`);
    if (active?.started_at) {
      windowStart = active.started_at;
    }
  }
  const { totalEthanolGrams, promille } = calculatePromille(entries, productsById, profile, now, windowStart);
  const totalLiters = entries.reduce((sum, entry) => {
    const product = productsById[entry.product_id];
    if (!product) {
      return sum;
    }
    const serving = entry.serving_override_ml ?? product.default_serving_ml;
    return sum + (serving * entry.qty) / 1000;
  }, 0);
  const response: SummaryResponse = {
    total_ethanol_grams: Number(totalEthanolGrams.toFixed(2)),
    total_liters: Number(totalLiters.toFixed(2)),
    estimated_promille: Number(promille.toFixed(2)),
    mode: modeForPromille(promille),
    disclaimer: DISCLAIMER
  };
  return json(response);
};
