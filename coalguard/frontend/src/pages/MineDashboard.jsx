import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import AccountabilityTimeline from '../components/AccountabilityTimeline';

export default function MineDashboard() {
  const { mineId } = useParams();
  const [summary, setSummary] = useState(null);
  const [compliance, setCompliance] = useState([]);
  const [selectedActionId, setSelectedActionId] = useState(null);

  // Hardcode an action ID from the seed data for demo purposes if needed, 
  // or ideally fetch a list of actions. In a real scenario we would fetch actions for this mine.
  // For the MVP, we just demonstrate the timeline component with the seeded action.
  const seededActionId = 'ca1-c';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, compRes] = await Promise.all([
          api.get(`/dashboard/summary?mine_id=${mineId}`),
          api.get(`/compliance?mine_id=${mineId}`)
        ]);
        setSummary(sumRes.data);
        setCompliance(compRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (mineId) fetchData();
  }, [mineId]);

  return (
    <div className="container">
      <div className="flex-between mb-6">
        <h1 className="text-3xl">Mine Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="/khaan-netra/index.html" target="_blank" rel="noreferrer" className="btn-primary" style={{ background: '#3b82f6', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            Open Khaan Netra (CV Scanner)
          </a>
          <a href="/telemetry" className="btn-primary" style={{ width: 'auto', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            Live telemetry
          </a>
        </div>
      </div>
      
      {summary && (
        <div className="dashboard-grid">
          <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <h3 className="text-muted mb-2">Mine Compliance</h3>
            <p className="text-3xl">{summary.compliance_rate}%</p>
          </div>
          <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
            <h3 className="text-muted mb-2">Open Violations</h3>
            <p className="text-3xl">{summary.open_violations}</p>
          </div>
          <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <h3 className="text-muted mb-2">Overdue Actions</h3>
            <p className="text-3xl">{summary.overdue_actions}</p>
          </div>
        </div>
      )}

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <h2 className="text-xl mb-4">Compliance Requirements</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Requirement</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {compliance.map((req) => (
                <tr key={req.id}>
                  <td style={{ fontWeight: 600 }}>{req.title}</td>
                  <td className="text-muted" style={{ textTransform: 'none' }}>
                    {new Date(req.due_date).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`status-badge ${req.status === 'compliant' ? 'status-green' : 'status-red'}`}>
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="flex-between mb-4">
            <h2 className="text-xl">Action Timeline Demo</h2>
            <button 
              className="btn-primary" 
              style={{ width: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
              onClick={() => setSelectedActionId(seededActionId)}
            >
              Load Seeded Action Timeline
            </button>
          </div>
          {selectedActionId ? (
            <AccountabilityTimeline actionId={selectedActionId} />
          ) : (
            <p className="text-muted">Click the button to view the accountability timeline of the seeded corrective action.</p>
          )}
        </div>
      </div>
    </div>
  );
}
