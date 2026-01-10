import type { DrinkEntry, DrinkProduct } from '../../../../shared/types';
import { requireAuth } from '../../../_lib/auth';
import { readJson } from '../../../_lib/body';
import { errorJson, json } from '../../../_lib/response';
import { requireNumber, requireString } from '../../../_lib/validate';
import { getIndex, getJson, putJson, pushToIndex, removeFromIndex } from '../../../_lib/kv';
import { formatDateKey } from '../../../_lib/dates';
import { getMemberRole } from '../../../_lib/crew';

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
  const body = await readJson<Partial<DrinkEntry> & { timezone_offset_minutes?: number }>(request);
  try {
    const productId = requireString(body.product_id, 'product_id');
    const product = await getJson<DrinkProduct>(env.APP_KV, `crew:${crewId}:products:${productId}`);
    if (!product || product.is_archived) {
      return errorJson('NOT_FOUND', 'Product not found', 404);
    }
    const entryId = crypto.randomUUID();
    const timestamp = body.timestamp ? requireNumber(body.timestamp, 'timestamp') : Date.now();
    const entry: DrinkEntry = {
      entry_id: entryId,
      crew_id: crewId,
      user_id: auth.user.id,
      product_id: productId,
      qty: body.qty ? requireNumber(body.qty, 'qty') : 1,
      timestamp,
      serving_override_ml: body.serving_override_ml ? requireNumber(body.serving_override_ml, 'serving_override_ml') : undefined,
      note: body.note
    };
    await putJson(env.APP_KV, `crew:${crewId}:entries:${entryId}`, entry);
    const offset = body.timezone_offset_minutes ?? 0;
    const dateKey = formatDateKey(timestamp, offset);
    await pushToIndex(env.APP_KV, `crew:${crewId}:entries:index:${dateKey}`, entryId);
    await pushToIndex(env.APP_KV, `crew:${crewId}:entries:byUser:${auth.user.id}:${dateKey}`, entryId);
    await pushToIndex(env.APP_KV, `crew:${crewId}:entries:index`, entryId);
    return json({ entry });
  } catch (error) {
    return errorJson('VALIDATION_ERROR', (error as Error).message, 400);
  }
};

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
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const userId = url.searchParams.get('userId');
  let entries: DrinkEntry[] = [];
  if (from && to) {
    const days = await getIndex(env.APP_KV, `crew:${crewId}:entries:index:${from}`);
    const entriesFrom = await Promise.all(days.map((id) => getJson<DrinkEntry>(env.APP_KV, `crew:${crewId}:entries:${id}`)));
    entries = entriesFrom.filter((entry): entry is DrinkEntry => Boolean(entry));
    if (userId) {
      entries = entries.filter((entry) => entry.user_id === userId);
    }
  } else {
    const index = await getIndex(env.APP_KV, `crew:${crewId}:entries:index`);
    const entriesAll = await Promise.all(index.map((id) => getJson<DrinkEntry>(env.APP_KV, `crew:${crewId}:entries:${id}`)));
    entries = entriesAll.filter((entry): entry is DrinkEntry => Boolean(entry));
  }
  return json({ entries });
};

export const onRequestDelete: PagesFunction = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) {
    return auth;
  }
  const crewId = params.crewId as string;
  const role = await getMemberRole(env.APP_KV, crewId, auth.user.id);
  if (!role) {
    return errorJson('FORBIDDEN', 'Not a crew member', 403);
  }
  const body = await readJson<{ entry_id?: string; date_key?: string }>(request);
  const entryId = body.entry_id;
  if (!entryId) {
    return errorJson('VALIDATION_ERROR', 'Missing entry_id', 400);
  }
  await env.APP_KV.delete(`crew:${crewId}:entries:${entryId}`);
  await removeFromIndex(env.APP_KV, `crew:${crewId}:entries:index`, entryId);
  if (body.date_key) {
    await removeFromIndex(env.APP_KV, `crew:${crewId}:entries:index:${body.date_key}`, entryId);
    await removeFromIndex(env.APP_KV, `crew:${crewId}:entries:byUser:${auth.user.id}:${body.date_key}`, entryId);
  }
  return json({ ok: true });
};
