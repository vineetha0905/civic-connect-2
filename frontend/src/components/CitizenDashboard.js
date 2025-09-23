import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../App';
import { Camera, FileText, MapPin, Home, Bell, User, LogOut, Trophy } from 'lucide-react';
import IssueMap from './IssueMap';
import apiService from '../services/api';

const CitizenDashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const [stats, setStats] = useState({
    totalIssues: 0,
    myIssues: 0,
    nearbyIssues: 0
  });
  const [issues, setIssues] = useState([]);
  const [allIssues, setAllIssues] = useState([]);
  const [radiusKm, setRadiusKm] = useState(5);
  const [userCenter, setUserCenter] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle'); // idle | requesting | granted | denied | error
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    if (user && user.id) {
      fetchDashboardData();
      fetchAndMapIssues();
    }
    requestLocation();
  }, [user]);

  const requestLocation = async () => {
    try {
      setGeoError('');
      if (!('geolocation' in navigator)) {
        setGeoStatus('error');
        setGeoError('Geolocation is not supported by this browser.');
        setUserCenter([16.0716, 77.9053]);
        return;
      }

      // Try to check permission status if supported
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          if (status.state === 'denied') {
            setGeoStatus('denied');
          }
        }
      } catch (_) { /* ignore permission API errors */ }

      setGeoStatus('requesting');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserCenter([latitude, longitude]);
          setGeoStatus('granted');
        },
        (err) => {
          console.warn('Geolocation error:', err?.message);
          setGeoError(err?.message || 'Unable to get your location');
          // Fallback center
          setUserCenter([16.0716, 77.9053]);
          setGeoStatus(err?.code === 1 ? 'denied' : 'error');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    } catch (e) {
      setGeoStatus('error');
      setGeoError('Unexpected error requesting location');
      setUserCenter([16.0716, 77.9053]);
    }
  };

  const fetchDashboardData = async () => {
    try {
      if (!user || !user.id) return;
      const [issuesResponse, myIssuesResponse] = await Promise.all([
        apiService.getIssues({ limit: 10 }),
        apiService.getIssues({ userId: user.id })
      ]);
      
      setStats({
        totalIssues: issuesResponse.total || 0,
        myIssues: myIssuesResponse.total || 0,
        nearbyIssues: issuesResponse.total || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchAndMapIssues = async () => {
    try {
      const response = await apiService.getIssues({ limit: 100 });
      const mappedIssues = (response.data?.issues || response.issues || []).map(issue => ({
        id: issue._id || issue.id,
        title: issue.title,
        description: issue.description,
        location: issue.location?.name || 'Location not specified',
        coordinates: issue.location?.coordinates ?
          [issue.location.coordinates.latitude, issue.location.coordinates.longitude] :
          [16.0716, 77.9053],
        status: issue.status || 'reported',
        upvotes: issue.upvotedBy?.length || 0
      }));
      setAllIssues(mappedIssues);
      setIssues(filterByRadius(mappedIssues, radiusKm));
    } catch (error) {
      console.error('Error fetching issues for map:', error);
    }
  };

  const toRad = (value) => (value * Math.PI) / 180;
  const distanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filterByRadius = (list, radius) => {
    const [lat, lng] = userCenter || [16.0716, 77.9053];
    return list.filter(item => {
      const [ilat, ilng] = item.coordinates || [];
      if (typeof ilat !== 'number' || typeof ilng !== 'number') return false;
      return distanceKm(lat, lng, ilat, ilng) <= radius;
    });
  };

  useEffect(() => {
    if (allIssues.length > 0) {
      setIssues(filterByRadius(allIssues, radiusKm));
    }
  }, [radiusKm, allIssues, userCenter]);

  const handleLogout = () => {
    localStorage.removeItem('civicconnect_user');
    localStorage.removeItem('civicconnect_token');
    setUser(null);
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <h1 className="dashboard-greeting">Hello, {user.name}!</h1>
            <p className="dashboard-subtitle">Welcome back to CivicConnect</p>
          </div>
          <button 
            onClick={handleLogout}
            style={{ 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              color: 'white', 
              padding: '0.5rem',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="dashboard-actions">
        <div className="actions-grid">
          <div className="action-card" onClick={() => navigate('/report-issue')}>
            <div className="action-icon">
              <Camera size={24} />
            </div>
            <div className="action-content">
              <h3>{t('reportIssue')}</h3>
              <p>Report a new civic issue in your area</p>
            </div>
          </div>

          <div className="action-card" onClick={() => navigate('/my-reports')}>
            <div className="action-icon">
              <FileText size={24} />
            </div>
            <div className="action-content">
              <h3>{t('myReports')}</h3>
              <p>Track your reported issues</p>
            </div>
          </div>

          <div className="action-card" onClick={() => navigate('/nearby-issues')}>
            <div className="action-icon">
              <MapPin size={24} />
            </div>
            <div className="action-content">
              <h3>{t('nearbyIssues')}</h3>
              <p>View and support community issues</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '1rem' }}>
        <h3 style={{ 
          fontSize: '1.2rem', 
          fontWeight: '600', 
          color: '#1e293b', 
          marginBottom: '1rem' 
        }}>
          Issues Near You
        </h3>
        {geoStatus !== 'granted' && (
          <div style={{ 
            background: '#fff7ed', 
            border: '1px solid #fed7aa', 
            color: '#9a3412', 
            padding: '10px', 
            borderRadius: '8px', 
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem' }}>
                {geoStatus === 'requesting' ? 'Requesting your location…' :
                 geoStatus === 'denied' ? 'Location permission denied. Please allow access to show nearby issues.' :
                 geoStatus === 'error' ? (geoError || 'Unable to determine your location.') :
                 'We use your location to show nearby issues.'}
              </span>
              <button onClick={requestLocation} style={{
                background: '#fb923c', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer'
              }}>
                Use my location
              </button>
            </div>
            {geoStatus === 'denied' && (
              <div style={{ marginTop: '6px', fontSize: '0.8rem' }}>
                Tip: In your browser address bar, click the location icon and allow access for this site.
              </div>
            )}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ color: '#475569', fontSize: '0.9rem' }}>Radius: {radiusKm} km</span>
          <input 
            type="range" 
            min="1" 
            max="20" 
            step="1" 
            value={radiusKm} 
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ color: '#475569', fontSize: '0.9rem' }}>{issues.length} issues</span>
        </div>
        <IssueMap issues={issues} center={userCenter || [16.0716, 77.9053]} />
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div className="nav-item active">
          <Home size={20} />
          <span>Home</span>
        </div>
        <div className="nav-item" onClick={() => navigate('/nearby-issues')}>
          <MapPin size={20} />
          <span>Map</span>
        </div>
        <div className="nav-item">
          <Bell size={20} />
          <span>Notifications</span>
        </div>
        <div className="nav-item" onClick={() => navigate('/profile')}>
          <User size={20} />
          <span>Profile</span>
        </div>
        <div className="nav-item" onClick={() => navigate('/leaderboard')}>
          <Trophy size={20} />
          <span>Leaderboard</span>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;