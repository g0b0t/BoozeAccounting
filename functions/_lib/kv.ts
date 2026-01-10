export async function getJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  return kv.get<T>(key, 'json');
}

export async function putJson(kv: KVNamespace, key: string, value: unknown): Promise<void> {
  await kv.put(key, JSON.stringify(value));
}

export async function getIndex(kv: KVNamespace, key: string): Promise<string[]> {
  const value = await kv.get<string[]>(key, 'json');
  return value ?? [];
}

export async function pushToIndex(kv: KVNamespace, key: string, id: string): Promise<void> {
  const current = await getIndex(kv, key);
  if (!current.includes(id)) {
    current.unshift(id);
  }
  await putJson(kv, key, current);
}

export async function removeFromIndex(kv: KVNamespace, key: string, id: string): Promise<void> {
  const current = await getIndex(kv, key);
  const next = current.filter((item) => item !== id);
  await putJson(kv, key, next);
}
