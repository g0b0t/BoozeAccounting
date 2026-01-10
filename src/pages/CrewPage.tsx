import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../lib/store';
import { ApiClient } from '../lib/api';
import type { Crew, CrewMember } from '@shared/types';
import { useNavigate } from 'react-router-dom';

export default function CrewPage() {
  const { initData, activeCrewId, crews } = useAuth();
  const crewId = activeCrewId ?? crews[0]?.crew_id;
  const client = useMemo(() => new ApiClient(initData), [initData]);
  const [crew, setCrew] = useState<Crew | null>(null);
  const [members, setMembers] = useState<CrewMember[]>([]);
  const [role, setRole] = useState<'ADMIN' | 'MEMBER' | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!crewId) return;
    const load = async () => {
      const [crewRes, membersRes] = await Promise.all([
        client.request<{ crew: Crew; role: 'ADMIN' | 'MEMBER' }>(`/api/crew/${crewId}`),
        client.request<{ members: CrewMember[] }>(`/api/crew/${crewId}/members`)
      ]);
      setCrew(crewRes.crew);
      setRole(crewRes.role);
      setMembers(membersRes.members);
    };
    load().catch(() => null);
  }, [crewId, client]);

  const copyInvite = () => {
    if (!crew) return;
    navigator.clipboard.writeText(crew.invite_code).catch(() => null);
  };

  return (
    <Layout title="Crew">
      <Card>
        <h3>{crew?.name}</h3>
        <p>Invite code: {crew?.invite_code}</p>
        <Button variant="secondary" onClick={copyInvite}>
          Скопировать
        </Button>
      </Card>

      <Card>
        <h3>Участники</h3>
        <ul className="list">
          {members.map((member) => (
            <li key={member.user_id}>
              {member.user_id} — {member.role}
            </li>
          ))}
        </ul>
      </Card>

      {role === 'ADMIN' ? (
        <Card>
          <h3>Админ</h3>
          <Button full onClick={() => navigate('/crew/products')}>
            Управление напитками
          </Button>
          <Button full variant="secondary" onClick={() => navigate('/crew/suggestions')}>
            Предложения
          </Button>
        </Card>
      ) : null}
    </Layout>
  );
}
