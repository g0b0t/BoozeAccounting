import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiClient } from '../lib/api';
import { getTelegramInitData } from '../lib/telegram';
import { useAuth } from '../lib/store';
import { Card } from '../components/Card';
import { Skeleton } from '../components/Skeleton';

export default function GatePage() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  useEffect(() => {
    const initData = getTelegramInitData();
    if (!initData) {
      setError('Откройте приложение внутри Telegram.');
      return;
    }
    const client = new ApiClient(initData);
    client
      .request<{ user: unknown; crews: unknown[]; hasProfile: boolean }>('/api/auth', {
        method: 'POST'
      })
      .then((data) => {
        setAuth({
          user: data.user as never,
          crews: data.crews as never,
          hasProfile: data.hasProfile,
          initData
        });
        if (!data.hasProfile) {
          navigate('/onboarding/profile');
        } else if (data.crews.length === 0) {
          navigate('/crew/choose');
        } else {
          navigate('/main');
        }
      })
      .catch((err) => setError(err.message));
  }, [navigate, setAuth]);

  return (
    <div className="center-screen">
      <Card>
        <h2>Загружаем…</h2>
        {error ? <p className="error">{error}</p> : null}
        {!error ? (
          <div className="stack">
            <Skeleton height={16} />
            <Skeleton height={16} />
            <Skeleton height={16} />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
