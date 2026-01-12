import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../lib/store';
import { ApiClient } from '../lib/api';
import type { Crew, CrewMember } from '@shared/types';
import { useNavigate } from 'react-router-dom';
import { AvatarRow } from '../components/AvatarRow';

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
        <div className="stack">
          <div className="invite-block">
            <span>{crew?.invite_code}</span>
            <Button variant="secondary" onClick={copyInvite}>
              Скопировать
            </Button>
          </div>
          <p className="muted">Отправьте код другу, чтобы он присоединился.</p>
        </div>
      </Card>

      <Card>
        <h3>Участники</h3>
        <AvatarRow users={members.map((member) => ({ id: member.user_id, name: member.user_id }))} />
        <ul className="list">
          {members.map((member) => (
            <li key={member.user_id} className="list-item">
              <div className="list-item-text">
                <strong>{member.user_id}</strong>
                <span className="muted">{member.role}</span>
              </div>
              <span>👤</span>
            </li>
          ))}
        </ul>
      </Card>

      {role === 'ADMIN' ? (
        <Card>
          <h3>Админ</h3>
          <div className="stack">
            <Button full onClick={() => navigate('/crew/products')}>
              Управление напитками
            </Button>
            <Button full variant="secondary" onClick={() => navigate('/crew/suggestions')}>
              Предложения
            </Button>
          </div>
        </Card>
      ) : null}
    </Layout>
  );
}
