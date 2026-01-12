import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { BigTapButton } from '../components/BigTapButton';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { ApiClient } from '../lib/api';
import { useAuth } from '../lib/store';
import type { DrinkEntry, DrinkProduct, SummaryResponse } from '@shared/types';
import { addPendingEntry, getPendingEntries, setPendingEntries, type PendingEntry } from '../lib/offline';
import { useNavigate } from 'react-router-dom';

export default function MainDrinkPage() {
  const { initData, activeCrewId, crews } = useAuth();
  const crewId = activeCrewId ?? crews[0]?.crew_id;
  const [products, setProducts] = useState<DrinkProduct[]>([]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOther, setShowOther] = useState(false);
  const [undoId, setUndoId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(getPendingEntries().length);
  const navigate = useNavigate();

  const client = useMemo(() => new ApiClient(initData), [initData]);

  const load = async () => {
    if (!crewId) return;
    const [productRes, summaryRes] = await Promise.all([
      client.request<{ products: DrinkProduct[] }>(`/api/crew/${crewId}/products`),
      client.request<SummaryResponse>(`/api/crew/${crewId}/summary`)
    ]);
    setProducts(productRes.products.filter((product) => !product.is_archived));
    setSummary(summaryRes);
  };

  const syncPending = async () => {
    if (!crewId) return;
    const pending = getPendingEntries();
    if (pending.length === 0) return;
    const remaining: PendingEntry[] = [];
    for (const entry of pending) {
      try {
        await client.request(`/api/crew/${crewId}/entries`, {
          method: 'POST',
          body: JSON.stringify(entry)
        });
      } catch {
        remaining.push(entry);
      }
    }
    setPendingEntries(remaining);
    setPendingCount(remaining.length);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
    syncPending().catch(() => null);
    const handler = () => syncPending();
    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
  }, [crewId]);

  const onAdd = async (product: DrinkProduct) => {
    if (!crewId) return;
    const entry: PendingEntry = {
      entry_id: crypto.randomUUID(),
      crew_id: crewId,
      user_id: 'me',
      product_id: product.product_id,
      qty: 1,
      timestamp: Date.now()
    };
    try {
      const payload = { product_id: product.product_id, qty: 1, timestamp: entry.timestamp, timezone_offset_minutes: new Date().getTimezoneOffset() * -1 };
      const response = await client.request<{ entry: DrinkEntry }>(`/api/crew/${crewId}/entries`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setUndoId(response.entry.entry_id);
      setToast(`Добавлено ${product.emoji} ${product.name}`);
      setTimeout(() => setToast(null), 2000);
      await load();
    } catch (err) {
      addPendingEntry({ ...entry, timezone_offset_minutes: new Date().getTimezoneOffset() * -1 });
      setPendingCount(getPendingEntries().length);
      setToast('Нет сети: запись сохранена локально');
      setTimeout(() => setToast(null), 2000);
    }
  };

  const undo = async () => {
    if (!crewId || !undoId) return;
    try {
      await client.request(`/api/crew/${crewId}/entries/undo`, { method: 'POST' });
      setUndoId(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const beer = products.filter((product) => product.category === 'BEER');
  const other = products.filter((product) => product.category !== 'BEER');

  return (
    <Layout title="Drink" mode={summary?.mode}>
      {summary?.mode === 'SAFETY' ? (
        <Card className="safety card-critical">
          <h2>🚨 Безопасность</h2>
          <p className="muted">Не за руль. Сделай паузу.</p>
          <div className="stack">
            <Button full onClick={() => setToast('Вода — лучший выбор')}>💧 Вода/перерыв</Button>
            <Button full variant="danger" onClick={() => window.close()}>Закрыть приложение</Button>
          </div>
        </Card>
      ) : null}

      {summary ? (
        <Card className="summary-card">
          <div className="summary-top">
            <h3>Сегодня</h3>
            <span className={`pill ${summary.mode === 'DRUNK' ? 'pill-warning' : summary.mode === 'SAFETY' ? 'pill-danger' : 'pill-success'}`}>
              {summary.mode}
            </span>
          </div>
          <div className="summary-stats">
            <div className="stat-block">
              <div className="label">Промилле</div>
              <div className="stat-value">{summary.estimated_promille}‰</div>
            </div>
            <div className="stat-block">
              <div className="label">Сегодня</div>
              <div className="muted">{summary.disclaimer}</div>
            </div>
          </div>
        </Card>
      ) : null}

      {pendingCount > 0 ? <p className="muted">Не синхронизировано: {pendingCount}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="grid">
        {beer.map((product) => (
          <BigTapButton
            key={product.product_id}
            emoji={product.emoji}
            label={product.name}
            sub={product.serving_label}
            onTap={() => onAdd(product)}
          />
        ))}
      </div>

      <Button full variant="secondary" onClick={() => setShowOther(true)}>
        + ДРУГОЕ
      </Button>

      {undoId ? (
        <Button full variant="ghost" onClick={undo}>
          Undo 30 секунд
        </Button>
      ) : null}

      <Modal open={showOther} title="Другие напитки" onClose={() => setShowOther(false)}>
        <div className="grid">
          {other.map((product) => (
            <BigTapButton
              key={product.product_id}
              emoji={product.emoji}
              label={product.name}
              sub={product.serving_label}
              onTap={() => onAdd(product)}
            />
          ))}
        </div>
        <div className="divider" />
        <Button full variant="secondary" onClick={() => navigate('/crew/suggestions')}>
          Предложить напиток
        </Button>
      </Modal>

      {toast ? <Toast message={toast} /> : null}
    </Layout>
  );
}
