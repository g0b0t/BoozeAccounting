import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../lib/store';
import { ApiClient } from '../lib/api';

const steps = ['Рост (см)', 'Вес (кг)', 'Возраст (лет)', 'Пол'];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { initData, setAuth } = useAuth();
  const [step, setStep] = useState(0);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(75);
  const [age, setAge] = useState(25);
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [error, setError] = useState<string | null>(null);

  const client = new ApiClient(initData);

  const next = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prev = () => setStep((prev) => Math.max(prev - 1, 0));

  const save = async () => {
    try {
      await client.request('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ height_cm: height, weight_kg: weight, age_years: age, sex })
      });
      setAuth({ hasProfile: true });
      navigate('/crew/choose');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="center-screen">
      <Card>
        <h2>Профиль {step + 1}/4</h2>
        <p className="muted">Нужно для расчёта промилле.</p>
        <div className="profile-progress">
          {steps.map((_, index) => (
            <span key={steps[index]} className={`profile-dot ${index <= step ? 'active' : ''}`} />
          ))}
        </div>
        <div className="profile-step">
          <h3>{steps[step]}</h3>
          {step === 0 ? (
            <input type="range" min={140} max={210} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
          ) : null}
          {step === 1 ? (
            <input type="range" min={40} max={140} value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
          ) : null}
          {step === 2 ? (
            <input type="range" min={18} max={80} value={age} onChange={(e) => setAge(Number(e.target.value))} />
          ) : null}
          {step === 3 ? (
            <div className="segmented">
              <Button variant={sex === 'male' ? 'primary' : 'secondary'} onClick={() => setSex('male')}>
                👨 Муж
              </Button>
              <Button variant={sex === 'female' ? 'primary' : 'secondary'} onClick={() => setSex('female')}>
                👩 Жен
              </Button>
            </div>
          ) : null}
          <div className="value-pill">
            {step === 0 ? `${height} см` : null}
            {step === 1 ? `${weight} кг` : null}
            {step === 2 ? `${age} лет` : null}
            {step === 3 ? (sex === 'male' ? 'male' : 'female') : null}
          </div>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <div className="row">
          {step > 0 ? (
            <Button variant="secondary" onClick={prev}>
              Назад
            </Button>
          ) : null}
          {step < steps.length - 1 ? (
            <Button onClick={next}>Дальше</Button>
          ) : (
            <Button onClick={save}>Сохранить</Button>
          )}
        </div>
      </Card>
    </div>
  );
}
