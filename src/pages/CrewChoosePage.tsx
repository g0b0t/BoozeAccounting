import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../lib/store';
import { ApiClient } from '../lib/api';
import type { Crew } from '@shared/types';

export default function CrewChoosePage() {
  const { initData, crews, setAuth } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [invite, setInvite] = useState('');
  const [error, setError] = useState<string | null>(null);
  const client = new ApiClient(initData);

  const createCrew = async () => {
    try {
      const data = await client.request<{ crew: Crew }>('/api/crew', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
      setAuth({ crews: [...crews, data.crew], activeCrewId: data.crew.crew_id });
      navigate('/main');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const joinCrew = async () => {
    try {
      const data = await client.request<{ crew: Crew }>('/api/crew/join', {
        method: 'POST',
        body: JSON.stringify({ invite_code: invite })
      });
      setAuth({ crews: [...crews, data.crew], activeCrewId: data.crew.crew_id });
      navigate('/main');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="center-screen">
      <Card>
        <h2>Выберите Crew</h2>
        <div className="stack">
          {crews.map((crew) => (
            <Button key={crew.crew_id} variant="secondary" onClick={() => {
              setAuth({ activeCrewId: crew.crew_id });
              navigate('/main');
            }}>
              {crew.name}
            </Button>
          ))}
        </div>
        <div className="divider" />
        <label className="label">Создать crew</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Название" />
        <Button full onClick={createCrew} disabled={!name}>
          Создать
        </Button>
        <div className="divider" />
        <label className="label">Вступить по коду</label>
        <input className="input" value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="CODE" />
        <Button full variant="secondary" onClick={joinCrew} disabled={!invite}>
          Вступить
        </Button>
        {error ? <p className="error">{error}</p> : null}
      </Card>
    </div>
  );
}
