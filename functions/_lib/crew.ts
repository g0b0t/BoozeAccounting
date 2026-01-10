import type { CrewMember, CrewRole } from '../../shared/types';
import { getJson } from './kv';

export async function getCrewMembers(kv: KVNamespace, crewId: string): Promise<CrewMember[]> {
  const key = `crew:${crewId}:members`;
  const members = await getJson<CrewMember[]>(kv, key);
  return members ?? [];
}

export async function getMemberRole(kv: KVNamespace, crewId: string, userId: string): Promise<CrewRole | null> {
  const members = await getCrewMembers(kv, crewId);
  const member = members.find((item) => item.user_id === userId);
  return member?.role ?? null;
}

export async function requireAdmin(kv: KVNamespace, crewId: string, userId: string): Promise<boolean> {
  const role = await getMemberRole(kv, crewId, userId);
  return role === 'ADMIN';
}
