export async function readJson<T = unknown>(request: Request): Promise<T> {
  const text = await request.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}
