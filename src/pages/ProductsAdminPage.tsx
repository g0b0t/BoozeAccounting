import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../lib/store';
import { ApiClient } from '../lib/api';
import type { DrinkProduct } from '@shared/types';

const categories = ['BEER', 'CIDER', 'WINE', 'SPIRITS', 'COCKTAIL', 'OTHER'] as const;

export default function ProductsAdminPage() {
  const { initData, activeCrewId, crews } = useAuth();
  const crewId = activeCrewId ?? crews[0]?.crew_id;
  const client = useMemo(() => new ApiClient(initData), [initData]);
  const [products, setProducts] = useState<DrinkProduct[]>([]);
  const [role, setRole] = useState<'ADMIN' | 'MEMBER' | null>(null);
  const [form, setForm] = useState({
    category: 'BEER',
    name: '',
    abv: 4.8,
    default_serving_ml: 500,
    serving_label: 'банка 0.5',
    emoji: '🍺'
  });

  const load = async () => {
    if (!crewId) return;
    const [productsRes, crewRes] = await Promise.all([
      client.request<{ products: DrinkProduct[] }>(`/api/crew/${crewId}/products`),
      client.request<{ role: 'ADMIN' | 'MEMBER' }>(`/api/crew/${crewId}`)
    ]);
    setProducts(productsRes.products);
    setRole(crewRes.role);
  };

  useEffect(() => {
    load().catch(() => null);
  }, [crewId]);

  const submit = async () => {
    if (!crewId) return;
    await client.request(`/api/crew/${crewId}/products`, { method: 'POST', body: JSON.stringify(form) });
    setForm({ ...form, name: '' });
    await load();
  };

  const archive = async (productId: string) => {
    if (!crewId) return;
    await client.request(`/api/crew/${crewId}/products/${productId}/archive`, { method: 'POST' });
    await load();
  };

  if (role === 'MEMBER') {
    return (
      <Layout title="Нет прав">
        <Card>
          <p>Доступ только для ADMIN.</p>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title="Напитки">
      <Card>
        <h3>Добавить напиток</h3>
        <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Название" />
        <input className="input" type="number" value={form.abv} onChange={(e) => setForm({ ...form, abv: Number(e.target.value) })} placeholder="ABV" />
        <input
          className="input"
          type="number"
          value={form.default_serving_ml}
          onChange={(e) => setForm({ ...form, default_serving_ml: Number(e.target.value) })}
          placeholder="ml"
        />
        <input className="input" value={form.serving_label} onChange={(e) => setForm({ ...form, serving_label: e.target.value })} placeholder="serving label" />
        <input className="input" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="emoji" />
        <Button full onClick={submit}>
          Добавить
        </Button>
      </Card>

      <Card>
        <h3>Каталог</h3>
        <ul className="list">
          {products.map((product) => (
            <li key={product.product_id} className="list-item">
              <div className="list-item-text">
                <strong>
                  {product.emoji} {product.name}
                </strong>
                <span className="muted">{product.abv}% · {product.serving_label}</span>
              </div>
              {product.is_archived ? (
                <span className="muted">архив</span>
              ) : (
                <Button variant="ghost" onClick={() => archive(product.product_id)}>
                  Архивировать
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </Layout>
  );
}
