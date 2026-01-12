import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { useAuth } from '../lib/store';
import { ApiClient } from '../lib/api';
import type { DrinkEntry, DrinkProduct, SummaryResponse } from '@shared/types';
import { dateKeyFromNow } from '../lib/date';
import { ethanolGramsForEntry } from '@shared/promille';

interface OnThisDayResponse {
  date: string;
  total_liters: number;
  total_ethanol_grams: number;
  top: { product: DrinkProduct; liters: number; ethanol: number }[];
}

export default function StatsPage() {
  const { initData, activeCrewId, crews } = useAuth();
  const crewId = activeCrewId ?? crews[0]?.crew_id;
  const client = useMemo(() => new ApiClient(initData), [initData]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [entries, setEntries] = useState<DrinkEntry[]>([]);
  const [products, setProducts] = useState<Record<string, DrinkProduct>>({});
  const [onThisDay, setOnThisDay] = useState<OnThisDayResponse | null>(null);

  useEffect(() => {
    if (!crewId) return;
    const load = async () => {
      const today = dateKeyFromNow();
      const [summaryRes, productsRes, entriesRes, onThisDayRes] = await Promise.all([
        client.request<SummaryResponse>(`/api/crew/${crewId}/summary`),
        client.request<{ products: DrinkProduct[] }>(`/api/crew/${crewId}/products`),
        client.request<{ entries: DrinkEntry[] }>(`/api/crew/${crewId}/entries?from=${today}&to=${today}`),
        client.request<OnThisDayResponse>(`/api/crew/${crewId}/stats/onthisday?date=${today}`)
      ]);
      setSummary(summaryRes);
      const map = Object.fromEntries(productsRes.products.map((product) => [product.product_id, product]));
      setProducts(map);
      setEntries(entriesRes.entries);
      setOnThisDay(onThisDayRes);
    };
    load().catch(() => null);
  }, [crewId, client]);

  const totalsByUser = entries.reduce<Record<string, { liters: number; ethanol: number }>>((acc, entry) => {
    const product = products[entry.product_id];
    if (!product) return acc;
    const liters = ((entry.serving_override_ml ?? product.default_serving_ml) * entry.qty) / 1000;
    const ethanol = ethanolGramsForEntry(entry, product);
    acc[entry.user_id] = acc[entry.user_id] || { liters: 0, ethanol: 0 };
    acc[entry.user_id].liters += liters;
    acc[entry.user_id].ethanol += ethanol;
    return acc;
  }, {});

  const leaderboard = Object.entries(totalsByUser).sort((a, b) => b[1].ethanol - a[1].ethanol);

  return (
    <Layout title="Stats" mode={summary?.mode}>
      <Card>
        <h3>Сегодня</h3>
        <div className="summary-stats">
          <div className="stat-block">
            <div className="label">Промилле</div>
            <div className="stat-value">{summary?.estimated_promille ?? 0}‰</div>
          </div>
          <div className="stat-block">
            <div className="label">Дисклеймер</div>
            <div className="muted">{summary?.disclaimer}</div>
          </div>
        </div>
      </Card>

      <Card>
        <h3>Лидерборд</h3>
        {leaderboard.length === 0 ? <p className="muted">Сегодня все святые.</p> : null}
        <ul className="list">
          {leaderboard.map(([userId, stats]) => (
            <li key={userId} className="list-item">
              <div className="list-item-text">
                <strong>{userId}</strong>
                <span className="muted">{stats.liters.toFixed(2)} л</span>
              </div>
              <span>{stats.ethanol.toFixed(1)} г</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h3>Год назад ({onThisDay?.date})</h3>
        {onThisDay && onThisDay.top.length > 0 ? (
          <div>
            <div className="stat-block">
              <div className="label">Всего</div>
              <div className="muted">
                {onThisDay.total_liters} л / {onThisDay.total_ethanol_grams} г этанола
              </div>
            </div>
            <ul className="list">
              {onThisDay.top.map((item) => (
                <li key={item.product.product_id} className="list-item">
                  <span>
                    {item.product.emoji} {item.product.name}
                  </span>
                  <span className="muted">{item.liters.toFixed(2)} л</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="muted">В тот день вы были святые, видимо.</p>
        )}
      </Card>
    </Layout>
  );
}
