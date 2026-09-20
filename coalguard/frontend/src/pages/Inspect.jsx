import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addToQueue, getQueue } from '../lib/idb';
import { syncOfflineQueue } from '../lib/api';

export default function Inspect() {
  const mineId = 'c0000000-0000-0000-0000-000000000000';
  const [severity, setSeverity] = useState('Low');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(false);
  const [gps, setGps] = useState({ lat: null, lon: null });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = React.useRef(null);

  const updateQueueCount = async () => {
    const q = await getQueue();
    setPendingCount(q.length);
  };

  useEffect(() => {
    updateQueueCount();

    const handleOnline = async () => {
      setIsOnline(true);
      await syncOfflineQueue();
      await updateQueueCount();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCaptureGPS = () => {
    setGps({ lat: 23.75, lon: 86.42 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if ((severity === 'High' || severity === 'Critical') && !photo) {
      setError('Photo is required for High/Critical severity observations.');
      return;
    }
    if (!gps.lat) {
      setError('GPS coordinates are required.');
      return;
    }

    const payload = {
      temp_uuid: uuidv4(),
      mine_id: mineId,
      gps_lat: gps.lat,
      gps_lon: gps.lon,
      severity,
      description,
      photo_url: photo ? "/fake/new_photo.jpg" : null
    };

    try {
      if (isOnline) {
        const { default: api } = await import('../lib/api');
        await api.post('/inspections', payload);
        setSuccess('Inspection submitted directly to server.');
      } else {
        await addToQueue(payload);
        await updateQueueCount();
        setSuccess('Offline. Saved to local queue.');
      }
      
      setDescription('');
      setPhoto(false);
      setGps({ lat: null, lon: null });
    } catch (err) {
      if (err.response?.status === 422) {
        const detail = err.response.data.detail;
        setError(typeof detail === 'string' ? detail : detail?.message || 'Validation failed');
      } else {
        setError('Failed to submit inspection');
      }
    }
  };

  return (
    <div className="container">
      <div className="flex-between mb-6">
        <h1 className="text-3xl">Field Inspection</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className={`status-badge ${isOnline ? 'status-green' : 'status-red'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
          {pendingCount > 0 && (
            <span className="status-badge" style={{ background: 'var(--warning)', color: 'white' }}>
              {pendingCount} Pending Sync
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        {error && <div className="status-badge status-red mb-4 text-center" style={{ width: '100%' }}>{error}</div>}
        {success && <div className="status-badge status-green mb-4 text-center" style={{ width: '100%' }}>{success}</div>}

        <div className="form-group">
          <label className="form-label">Severity</label>
          <select 
            value={severity} 
            onChange={(e) => setSeverity(e.target.value)}
            className="form-select"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-textarea"
            rows="3"
            required
            placeholder="Describe the observation..."
          />
        </div>

        <div className="flex-between form-group" style={{ gap: '1rem' }}>
          <button 
            type="button" 
            onClick={handleCaptureGPS}
            className="btn-primary"
            style={{ 
              background: gps.lat ? '#dcfce7' : '#e2e8f0', 
              color: gps.lat ? '#166534' : 'var(--text-main)' 
            }}
          >
            {gps.lat ? `GPS: ${gps.lat}, ${gps.lon}` : 'Capture GPS'}
          </button>
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            ref={fileInputRef} 
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setPhoto(true);
              }
            }}
            style={{ display: 'none' }} 
          />
          
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
            style={{ 
              background: photo ? '#dbeafe' : '#e2e8f0', 
              color: photo ? '#1e40af' : 'var(--text-main)' 
            }}
          >
            {photo ? 'Photo Attached' : 'Attach Photo'}
          </button>
        </div>

        <button type="submit" className="btn-primary mt-4">
          Save Inspection
        </button>
      </form>
    </div>
  );
}
