import React from 'react';
import { useNavigate } from 'react-router-dom';

const Leaderboard = () => {
  const navigate = useNavigate();
  const entries = [
    { name: 'You', points: 120 },
    { name: 'Citizen A', points: 110 },
    { name: 'Citizen B', points: 95 },
  ];

  return (
    <div className="form-container" style={{ paddingBottom: '80px' }}>
      <div className="form-card" style={{ maxWidth: 700 }}>
        <h1 style={{ marginBottom: '1rem' }}>Leaderboard</h1>
        <p style={{ color: '#64748b', marginBottom: '1rem' }}>
          Gamification points for reporting and helping resolve issues.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {entries.map((e, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 12 }}>
              <span>{idx + 1}. {e.name}</span>
              <strong>{e.points} pts</strong>
            </div>
          ))}
        </div>
        <button className="btn-secondary" style={{ marginTop: '1rem' }} onClick={() => navigate('/citizen')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;
