import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../lib/store';
import { ApiClient } from '../lib/api';
import type { DrinkSuggestion } from '@shared/types';

const categories = ['BEER', 'CIDER', 'WINE', 'SPIRITS', 'COCKTAIL', 'OTHER'] as const;

export default function SuggestionsPage() {
  const { initData, activeCrewId, crews } = useAuth();
  const crewId = activeCrewId ?? crews[0]?.crew_id;
  const client = useMemo(() => new ApiClient(initData), [initData]);
  const [role, setRole] = useState<'ADMIN' | 'MEMBER' | null>(null);
  const [suggestions, setSuggestions] = useState<DrinkSuggestion[]>([]);
  const [form, setForm] = useState({
    category: 'BEER',
    name: '',
    abv: 4.5,
    default_serving_ml: 500,
    serving_label: 'банка 0.5',
    emoji: '🍺'
  });

  const load = async () => {
    if (!crewId) return;
    const crewRes = await client.request<{ role: 'ADMIN' | 'MEMBER' }>(`/api/crew/${crewId}`);
    setRole(crewRes.role);
    const list = await client.request<{ suggestions: DrinkSuggestion[] }>(`/api/crew/${crewId}/suggestions?status=PENDING`);
    setSuggestions(list.suggestions);
  };

  useEffect(() => {
    load().catch(() => null);
  }, [crewId]);

  const submit = async () => {
    if (!crewId) return;
    await client.request(`/api/crew/${crewId}/suggestions`, { method: 'POST', body: JSON.stringify(form) });
    setForm({ ...form, name: '' });
    await load();
  };

  const approve = async (id: string) => {
    if (!crewId) return;
    await client.request(`/api/crew/${crewId}/suggestions/${id}/approve`, { method: 'POST' });
    await load();
  };

  const reject = async (id: string) => {
    if (!crewId) return;
    await client.request(`/api/crew/${crewId}/suggestions/${id}/reject`, { method: 'POST', body: JSON.stringify({ admin_note: 'Не подходит' }) });
    await load();
  };

  return (
    <Layout title="Предложения">
      <Card>
        <h3>Предложить напиток</h3>
        <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Название" />
        <input className="input" type="number" value={form.abv} onChange={(e) => setForm({ ...form, abv: Number(e.target.value) })} />
        <input className="input" type="number" value={form.default_serving_ml} onChange={(e) => setForm({ ...form, default_serving_ml: Number(e.target.value) })} />
        <input className="input" value={form.serving_label} onChange={(e) => setForm({ ...form, serving_label: e.target.value })} />
        <input className="input" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
        <Button full onClick={submit}>
          Отправить
        </Button>
      </Card>

      {role === 'ADMIN' ? (
        <Card>
          <h3>Pending</h3>
          <ul className="list">
            {suggestions.map((item) => (
              <li key={item.suggestion_id}>
                {item.emoji} {item.name} ({item.abv}%)
                <div className="row">
                  <Button variant="secondary" onClick={() => approve(item.suggestion_id)}>
                    Approve
                  </Button>
                  <Button variant="danger" onClick={() => reject(item.suggestion_id)}>
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </Layout>
  );
}
