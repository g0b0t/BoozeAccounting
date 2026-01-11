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
    let isActive = true;
    const waitForInitData = async (): Promise<string | null> => {
      const timeoutMs = 1500;
      const stepMs = 100;
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const initData = getTelegramInitData();
        if (initData) {
          return initData;
        }
        await new Promise((resolve) => setTimeout(resolve, stepMs));
      }
      return getTelegramInitData();
    };

    void waitForInitData().then((initData) => {
      if (!isActive) {
        return;
      }
      if (!initData) {
        console.info('[GatePage] Telegram initData missing', {
          hasTelegram: Boolean((window as Window & { Telegram?: unknown }).Telegram),
          hasWebApp: Boolean(
            (window as Window & { Telegram?: { WebApp?: unknown } }).Telegram?.WebApp
          ),
          locationSearch: window.location.search,
          locationHash: window.location.hash
        });
        setError('Откройте приложение внутри Telegram.');
        return;
      }
      const client = new ApiClient(null);
      client
        .request<{ user: unknown; crews: unknown[]; hasProfile: boolean }>('/api/auth', {
          method: 'POST',
          body: JSON.stringify({ initData })
        })
        .then((data) => {
          if (!isActive) {
            return;
          }
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
        .catch((err) => {
          if (!isActive) {
            return;
          }
          console.error('[GatePage] Auth request failed', err);
          setError(err.message);
        });
    });

    return () => {
      isActive = false;
    };
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
