import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await apiService.getLeaderboard();
        // Handle both direct response and nested data structure
        const responseData = response?.data || response;
        const leaderboard = responseData?.leaderboard || [];
        const userData = responseData?.currentUser || null;
        setEntries(Array.isArray(leaderboard) ? leaderboard : []);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setEntries([]);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    // Auto-refresh leaderboard every 5 seconds to reflect point changes
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="form-container" style={{ paddingBottom: '80px' }}>
      <div className="form-card" style={{ maxWidth: 700 }}>
        <h1 style={{ marginBottom: '1rem' }}>Leaderboard</h1>
        <p style={{ color: '#64748b', marginBottom: '1rem' }}>
          Gamification points for reporting and helping resolve issues.
        </p>
        
        {/* Current User Info */}
        {currentUser && (
          <div style={{ 
            background: '#e0f2fe', 
            padding: '1rem', 
            borderRadius: 12, 
            marginBottom: '1.5rem',
            border: '2px solid #0ea5e9'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.25rem' }}>Your Rank</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
                  #{currentUser.rank}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.25rem' }}>Your Points</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
                  {currentUser.points} pts
                </div>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>Loading leaderboard...</p>
        ) : entries.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No leaderboard data available.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {entries.map((e) => (
              <div 
                key={e.rank} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  background: e.isCurrentUser ? '#e0f2fe' : '#f8fafc', 
                  padding: '0.75rem 1rem', 
                  borderRadius: 12,
                  border: e.isCurrentUser ? '2px solid #0ea5e9' : 'none'
                }}
              >
                <span>{e.rank}. {e.isCurrentUser ? 'You' : e.name}</span>
                <strong>{e.points} pts</strong>
              </div>
            ))}
          </div>
        )}
        <button className="btn-secondary" style={{ marginTop: '1rem' }} onClick={() => navigate('/citizen')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;
