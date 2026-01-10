import { describe, expect, it } from 'vitest';
import { calculatePromille } from '../shared/promille';
import type { DrinkEntry, DrinkProduct } from '../shared/types';

const product: DrinkProduct = {
  product_id: 'beer',
  crew_id: 'crew',
  category: 'BEER',
  name: 'Beer',
  abv: 5,
  default_serving_ml: 500,
  serving_label: '0.5',
  emoji: '🍺',
  is_archived: false,
  created_at: 0,
  updated_at: 0
};

const entry: DrinkEntry = {
  entry_id: 'entry',
  crew_id: 'crew',
  user_id: 'user',
  product_id: 'beer',
  qty: 1,
  timestamp: 0
};

describe('calculatePromille', () => {
  it('calculates promille with metabolism', () => {
    const profile = { height_cm: 180, weight_kg: 80, age_years: 30, sex: 'male' as const };
    const now = 60 * 60 * 1000;
    const result = calculatePromille([entry], { beer: product }, profile, now, 0);
    expect(result.totalEthanolGrams).toBeGreaterThan(0);
    expect(result.promille).toBeGreaterThanOrEqual(0);
  });
});
