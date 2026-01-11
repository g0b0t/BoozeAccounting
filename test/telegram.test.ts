import { describe, expect, it } from 'vitest';
import { verifyTelegramInitData } from '../shared/telegram';

const encoder = new TextEncoder();

async function hmacSha256(key: Uint8Array, message: string): Promise<Uint8Array> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto API unavailable');
  }
  const cryptoKey = await subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return new Uint8Array(signature);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function buildInitData(botToken: string) {
  const params = {
    auth_date: '1710000000',
    query_id: 'AAE123',
    user: JSON.stringify({ id: 12345, first_name: 'Test' })
  };
  const dataCheckString = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key as keyof typeof params]}`)
    .join('\n');
  const secretKey = await hmacSha256(encoder.encode('WebAppData'), botToken);
  const hash = bytesToHex(await hmacSha256(secretKey, dataCheckString));
  const search = new URLSearchParams({ ...params, hash });
  return search.toString();
}

describe('verifyTelegramInitData', () => {
  it('validates correct initData', async () => {
    const token = '123:ABC';
    const initData = await buildInitData(token);
    await expect(verifyTelegramInitData(initData, token)).resolves.toBe(true);
  });

  it('rejects invalid initData', async () => {
    const initData = await buildInitData('123:ABC');
    await expect(verifyTelegramInitData(initData, 'wrong')).resolves.toBe(false);
  });
});
