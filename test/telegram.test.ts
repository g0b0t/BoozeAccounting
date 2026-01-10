import { describe, expect, it } from 'vitest';
import { createHmac } from 'crypto';
import { verifyTelegramInitData } from '../shared/telegram';

function buildInitData(botToken: string) {
  const params = {
    auth_date: '1710000000',
    query_id: 'AAE123',
    user: JSON.stringify({ id: 12345, first_name: 'Test' })
  };
  const dataCheckString = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key as keyof typeof params]}`)
    .join('\n');
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  const search = new URLSearchParams({ ...params, hash });
  return search.toString();
}

describe('verifyTelegramInitData', () => {
  it('validates correct initData', () => {
    const token = '123:ABC';
    const initData = buildInitData(token);
    expect(verifyTelegramInitData(initData, token)).toBe(true);
  });

  it('rejects invalid initData', () => {
    const initData = buildInitData('123:ABC');
    expect(verifyTelegramInitData(initData, 'wrong')).toBe(false);
  });
});
