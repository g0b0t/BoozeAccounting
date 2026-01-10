import type { DrinkEntry, DrinkProduct } from '../../../../../shared/types';
import { requireAuth } from '../../../../_lib/auth';
import { errorJson, json } from '../../../../_lib/response';
import { getIndex, getJson } from '../../../../_lib/kv';
import { ethanolGramsForEntry } from '../../../../../shared/promille';
import { oneYearAgo } from '../../../../_lib/dates';
import { getMemberRole } from '../../../../_lib/crew';

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
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  if (!date) {
    return errorJson('VALIDATION_ERROR', 'Missing date', 400);
  }
  const targetDate = oneYearAgo(date);
  const index = await getIndex(env.APP_KV, `crew:${crewId}:entries:index:${targetDate}`);
  const entries = (await Promise.all(index.map((id) => getJson<DrinkEntry>(env.APP_KV, `crew:${crewId}:entries:${id}`))))
    .filter((entry): entry is DrinkEntry => Boolean(entry));
  const productsIndex = await getIndex(env.APP_KV, `crew:${crewId}:products:index`);
  const products = (await Promise.all(productsIndex.map((id) => getJson<DrinkProduct>(env.APP_KV, `crew:${crewId}:products:${id}`))))
    .filter((product): product is DrinkProduct => Boolean(product));
  const productsById = Object.fromEntries(products.map((product) => [product.product_id, product]));
  const totalsByProduct: Record<string, { liters: number; ethanol: number }> = {};
  for (const entry of entries) {
    const product = productsById[entry.product_id];
    if (!product) {
      continue;
    }
    const liters = ((entry.serving_override_ml ?? product.default_serving_ml) * entry.qty) / 1000;
    const ethanol = ethanolGramsForEntry(entry, product);
    totalsByProduct[entry.product_id] = {
      liters: (totalsByProduct[entry.product_id]?.liters ?? 0) + liters,
      ethanol: (totalsByProduct[entry.product_id]?.ethanol ?? 0) + ethanol
    };
  }
  const top = Object.entries(totalsByProduct)
    .map(([productId, stats]) => ({ product: productsById[productId], ...stats }))
    .sort((a, b) => b.ethanol - a.ethanol)
    .slice(0, 3);
  const totalLiters = top.reduce((sum, item) => sum + item.liters, 0);
  const totalEthanol = top.reduce((sum, item) => sum + item.ethanol, 0);
  return json({
    date: targetDate,
    total_liters: Number(totalLiters.toFixed(2)),
    total_ethanol_grams: Number(totalEthanol.toFixed(2)),
    top
  });
};
