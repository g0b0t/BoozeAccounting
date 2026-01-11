import type { UserProfile } from '../../shared/types';
import { requireAuth } from '../_lib/auth';
import { readJson } from '../_lib/body';
import { errorJson, json } from '../_lib/response';
import { requireEnum, requireNumber } from '../_lib/validate';
import type { Env } from '../_lib/auth';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) {
    return auth;
  }
  const profile = await env.APP_KV.get<UserProfile>(`profile:${auth.user.id}`, 'json');
  if (!profile) {
    return errorJson('PROFILE_NOT_FOUND', 'Profile missing', 404);
  }
  return json(profile);
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) {
    return auth;
  }
  const body = await readJson<Partial<UserProfile>>(request);
  try {
    const profile: UserProfile = {
      height_cm: requireNumber(body.height_cm, 'height_cm'),
      weight_kg: requireNumber(body.weight_kg, 'weight_kg'),
      age_years: requireNumber(body.age_years, 'age_years'),
      sex: requireEnum(body.sex, ['male', 'female'], 'sex'),
      updated_at: Date.now()
    };
    await env.APP_KV.put(`profile:${auth.user.id}`, JSON.stringify(profile));
    return json(profile);
  } catch (error) {
    return errorJson('VALIDATION_ERROR', (error as Error).message, 400);
  }
};
