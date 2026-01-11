export function parseInitData(initData: string): Record<string, string> {
  const params = new URLSearchParams(initData);
  const data: Record<string, string> = {};
  params.forEach((value, key) => {
    data[key] = value;
  });
  return data;
}

const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSha256(key: Uint8Array, message: string): Promise<Uint8Array> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto API unavailable');
  }
  const keyData = Uint8Array.from(key);
  const cryptoKey = await subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return new Uint8Array(signature);
}

export async function verifyTelegramInitData(initData: string, botToken: string): Promise<boolean> {
  const data = parseInitData(initData);
  const hash = data.hash;
  if (!hash) {
    return false;
  }
  delete data.hash;
  const sortedKeys = Object.keys(data).sort();
  const dataCheckString = sortedKeys.map((key) => `${key}=${data[key]}`).join('\n');
  try {
    const secretKey = await hmacSha256(encoder.encode(botToken), 'WebAppData');
    const computedHash = await hmacSha256(secretKey, dataCheckString);
    return bytesToHex(computedHash) === hash;
  } catch {
    return false;
  }
}
