import { createHmac } from 'crypto';

export function parseInitData(initData: string): Record<string, string> {
  const params = new URLSearchParams(initData);
  const data: Record<string, string> = {};
  params.forEach((value, key) => {
    data[key] = value;
  });
  return data;
}

export function verifyTelegramInitData(initData: string, botToken: string): boolean {
  const data = parseInitData(initData);
  const hash = data.hash;
  if (!hash) {
    return false;
  }
  delete data.hash;
  const sortedKeys = Object.keys(data).sort();
  const dataCheckString = sortedKeys.map((key) => `${key}=${data[key]}`).join('\n');
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return computedHash === hash;
}
