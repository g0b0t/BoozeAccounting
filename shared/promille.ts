import type { DrinkEntry, DrinkProduct, Sex } from './types';

export const DRUNK_THRESHOLD = 0.6;
export const SAFETY_THRESHOLD = 1.2;
export const BETA_PER_HOUR = 0.15;

export function tbwLiters(sex: Sex, height_cm: number, weight_kg: number, age_years: number): number {
  if (sex === 'male') {
    return 2.447 - 0.09516 * age_years + 0.1074 * height_cm + 0.3362 * weight_kg;
  }
  return -2.097 + 0.1069 * height_cm + 0.2466 * weight_kg;
}

export function ethanolGramsForEntry(entry: DrinkEntry, product: DrinkProduct): number {
  const serving = entry.serving_override_ml ?? product.default_serving_ml;
  return serving * (product.abv / 100) * 0.789 * entry.qty;
}

export function calculatePromille(
  entries: DrinkEntry[],
  productsById: Record<string, DrinkProduct>,
  profile: { height_cm: number; weight_kg: number; age_years: number; sex: Sex },
  now: number,
  windowStart: number
): { totalEthanolGrams: number; promille: number; hoursSinceFirst: number } {
  const relevant = entries.filter((entry) => entry.timestamp >= windowStart && entry.timestamp <= now);
  if (relevant.length === 0) {
    return { totalEthanolGrams: 0, promille: 0, hoursSinceFirst: 0 };
  }
  const first = Math.min(...relevant.map((entry) => entry.timestamp));
  const totalEthanolGrams = relevant.reduce((sum, entry) => {
    const product = productsById[entry.product_id];
    if (!product) {
      return sum;
    }
    return sum + ethanolGramsForEntry(entry, product);
  }, 0);
  const tbw = tbwLiters(profile.sex, profile.height_cm, profile.weight_kg, profile.age_years);
  const promilleRaw = totalEthanolGrams / tbw;
  const hoursSinceFirst = (now - first) / (1000 * 60 * 60);
  const promille = Math.max(0, promilleRaw - BETA_PER_HOUR * hoursSinceFirst);
  return { totalEthanolGrams, promille, hoursSinceFirst };
}

export function modeForPromille(value: number): 'NORMAL' | 'DRUNK' | 'SAFETY' {
  if (value >= SAFETY_THRESHOLD) {
    return 'SAFETY';
  }
  if (value >= DRUNK_THRESHOLD) {
    return 'DRUNK';
  }
  return 'NORMAL';
}
