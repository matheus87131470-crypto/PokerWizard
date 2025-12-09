import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const auth = useAuth();
  const user = auth.user;

  if (!user) return <div style={{ paddingTop: 20 }}>Faça login para ver seu perfil.</div>;

  return (
    <div style={{ paddingTop: 20 }}>
      <h1>Olá, {user.name}</h1>
      <div style={{ marginTop: 12 }}>
        <p><strong>Nome:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Status do plano:</strong> {user.premium || (user.statusPlano === 'premium') ? 'Premium' : 'Free'}</p>
        <p><strong>Usos restantes:</strong> {user.usosRestantes === -1 || user.usosRestantes === null ? 'Ilimitado' : (typeof user.usosRestantes === 'number' ? user.usosRestantes : user.credits)}</p>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => window.location.assign('/premium')}>Assinar por R$ 5,90</button>
          <button className="btn btn-ghost" onClick={() => { auth.logout(); window.location.assign('/'); }}>Sair</button>
        </div>
      </div>
    </div>
  );
}
