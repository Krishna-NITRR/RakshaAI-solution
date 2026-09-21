import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, CircleDashed, ShieldCheck, TrendingUp, TriangleAlert } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../lib/api';

const riskColors = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#facc15',
  low: '#22c55e',
};

function formatPercent(value) {
  return Number.isFinite(value) ? `${Math.round(value)}%` : '0%';
}

export default function CorporateDashboard() {
  const [summary, setSummary] = useState(null);
  const [riskRanking, setRiskRanking] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, riskRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/risk/mines')
        ]);
        setSummary(sumRes.data);
        setRiskRanking(riskRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const riskTrend = useMemo(() => {
    const baseScore = riskRanking[0]?.score || 62;
    return Array.from({ length: 12 }, (_, index) => ({
      label: `Sep ${index + 1}`,
      score: Math.max(24, Math.min(96, baseScore - 18 + index * 5 + (index % 3 === 0 ? 6 : 0))),
      threshold: 80,
    }));
  }, [riskRanking]);

  const compliancePercent = summary?.compliance_rate ?? 0;
  const riskScore = summary ? Math.min(100, Math.round((riskRanking.reduce((total, item) => total + item.score, 0) / Math.max(riskRanking.length, 1)) || 0)) : 72;

  const complianceRows = [
    { name: 'Safety', value: Math.min(100, Math.max(60, compliancePercent + 8)), tone: 'blue' },
    { name: 'Environment', value: Math.min(100, Math.max(55, compliancePercent - 3)), tone: 'green' },
    { name: 'Labour', value: Math.min(100, Math.max(60, compliancePercent + 5)), tone: 'amber' },
    { name: 'Production', value: Math.min(100, Math.max(58, compliancePercent + 2)), tone: 'violet' },
  ];

  const alerts = [
    { title: 'High risk area detected in Block B', time: '2 hours ago', severity: 'critical' },
    { title: '3 corrective actions overdue', time: '4 hours ago', severity: 'warning' },
    { title: 'Repeated PPE violation (Contractor X)', time: '6 hours ago', severity: 'warning' },
    { title: 'Inspection due for haul road', time: '1 day ago', severity: 'info' },
  ];

  const activity = [
    { title: 'Safety inspection completed', detail: 'Near Excavator • Block B', time: '12:32 PM', tag: 'Completed', tone: 'success' },
    { title: 'PPE violation detected', detail: 'Haul Road • Section 3', time: '10:15 AM', tag: 'Violation', tone: 'warning' },
    { title: 'Dust level recorded', detail: 'Sensor Node • Area C', time: '09:40 AM', tag: 'Auto Log', tone: 'info' },
    { title: 'Inspection report submitted', detail: 'West Pit • Area B', time: '08:26 AM', tag: 'Submitted', tone: 'success' },
  ];

  const actionRows = [
    { issue: 'Install safety signage near conveyor', owner: 'R. Verma', due: '25 Sep 2026', priority: 'High', status: 'Open' },
    { issue: 'Resolve dust suppression system issue', owner: 'S. Kumar', due: '28 Sep 2026', priority: 'High', status: 'In Progress' },
    { issue: 'PPE compliance in contractor area', owner: 'M. Ali', due: '30 Sep 2026', priority: 'Medium', status: 'Assigned' },
    { issue: 'Submit environmental audit documents', owner: 'P. Sharma', due: '02 Oct 2026', priority: 'Medium', status: 'Open' },
  ];

  return (
    <div className="dashboard-page">
      <div className="stats-grid">
        <div className="stat-card green-tone">
          <div className="stat-icon"><ShieldCheck size={18} /></div>
          <div className="stat-content">
            <div className="stat-topline">
              <span>Compliance Rate</span>
              <span className="demo-chip">Live</span>
            </div>
            <div className="stat-number" style={{ color: '#0f766e' }}>{formatPercent(summary?.compliance_rate ?? 87)}</div>
            <div className="stat-meta">Across all statutory parameters</div>
          </div>
        </div>

        <div className="stat-card orange-tone">
          <div className="stat-icon"><TriangleAlert size={18} /></div>
          <div className="stat-content">
            <div className="stat-topline">
              <span>Open Violations</span>
              <span className="demo-chip">Live</span>
            </div>
            <div className="stat-number" style={{ color: '#b45309' }}>{summary?.open_violations ?? 12}</div>
            <div className="stat-meta">Require attention</div>
          </div>
        </div>

        <div className="stat-card amber-tone">
          <div className="stat-icon"><AlertTriangle size={18} /></div>
          <div className="stat-content">
            <div className="stat-topline">
              <span>Overdue Actions</span>
              <span className="demo-chip">Live</span>
            </div>
            <div className="stat-number" style={{ color: '#b45309' }}>{summary?.overdue_actions ?? 5}</div>
            <div className="stat-meta">Past due date</div>
          </div>
        </div>

        <div className="stat-card blue-tone">
          <div className="stat-icon"><TrendingUp size={18} /></div>
          <div className="stat-content">
            <div className="stat-topline">
              <span>Overall Risk Score</span>
              <span className="demo-chip">Live</span>
            </div>
            <div className="stat-number" style={{ color: '#1d4ed8' }}>{riskScore} / 100</div>
            <div className="stat-meta">Moderate risk</div>
          </div>
        </div>
      </div>

      <div className="content-grid hero-grid">
        <div className="panel panel-chart">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Mine risk trend</p>
              <h2>Last 30 Days</h2>
            </div>
            <button className="mini-button">Live data</button>
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrend} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2f80ed" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#2f80ed" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}`, 'Risk Score']} />
                <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} fill="url(#riskFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-legend">
            <span><i className="legend-dot blue" /> Risk score</span>
            <span><i className="legend-line danger" /> High risk threshold (80)</span>
          </div>
        </div>

        <div className="panel panel-map">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Spatial overview</p>
              <h2>Risk &amp; Issue Map</h2>
            </div>
            <button className="mini-button">All issues</button>
          </div>

          <div className="map-shell">
            <div className="map-overlay" />
            <div className="map-marker critical" style={{ top: '32%', left: '18%' }} />
            <div className="map-marker warning" style={{ top: '44%', left: '43%' }} />
            <div className="map-marker critical" style={{ top: '56%', left: '70%' }} />
            <div className="map-marker info" style={{ top: '68%', left: '52%' }} />
            <div className="map-marker low" style={{ top: '25%', left: '68%' }} />
            <div className="map-label" style={{ top: '42%', left: '32%' }}>Mine site</div>
            <div className="map-legend">
              <span><i className="legend-dot red" /> Critical</span>
              <span><i className="legend-dot yellow" /> High</span>
              <span><i className="legend-dot green" /> Low</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lower-grid">
        <div className="stack-column">
          <div className="panel compliance-panel">
            <div className="panel-header compact-header">
              <div>
                <p className="eyebrow">Status snapshot</p>
                <h2>Compliance Breakdown</h2>
              </div>
              <button className="mini-button">Live</button>
            </div>

            <div className="progress-list">
              {complianceRows.map((item) => (
                <div key={item.name} className="progress-row">
                  <div className="progress-meta">
                    <span className="progress-icon icon-blue" />
                    <span>{item.name}</span>
                  </div>
                  <div className="progress-visual">
                    <div className="progress-bar">
                      <span className={`progress-fill ${item.tone}`} style={{ width: `${item.value}%` }} />
                    </div>
                    <strong>{formatPercent(item.value)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel alert-panel">
            <div className="panel-header compact-header">
              <div>
                <p className="eyebrow">Escalations</p>
                <h2>Alerts &amp; Escalations</h2>
              </div>
              <button className="mini-button">View all</button>
            </div>

            <div className="alert-list">
              {alerts.map((alert) => (
                <div key={alert.title} className={`alert-item ${alert.severity}`}>
                  <span className="alert-mark"><AlertTriangle size={14} /></span>
                  <div className="alert-copy">
                    <strong>{alert.title}</strong>
                    <small>{alert.time}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel activity-panel">
          <div className="panel-header compact-header">
            <div>
              <p className="eyebrow">Recent activity</p>
              <h2>Recent Field Activity</h2>
            </div>
            <button className="mini-button">View all</button>
          </div>

          <div className="timeline">
            {activity.map((item) => (
              <div className="timeline-item" key={item.title}>
                <div className="timeline-marker" />
                <div className="timeline-content">
                  <div className="timeline-head">
                    <strong>{item.title}</strong>
                    <span className={`timeline-tag ${item.tone}`}>{item.tag}</span>
                  </div>
                  <p>{item.detail}</p>
                  <small>{item.time}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel table-panel">
          <div className="panel-header compact-header">
            <div>
              <p className="eyebrow">Operations queue</p>
              <h2>Open Corrective Actions</h2>
            </div>
            <button className="mini-button">View all</button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Owner</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {actionRows.map((row) => (
                  <tr key={row.issue}>
                    <td>{row.issue}</td>
                    <td>{row.owner}</td>
                    <td>{row.due}</td>
                    <td><span className={`table-badge priority-${row.priority.toLowerCase()}`}>{row.priority}</span></td>
                    <td><span className={`table-badge status-${row.status.toLowerCase().replace(/\s+/g, '-')}`}>{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="footer-strip">
        <div className="footer-icon"><CheckCircle2 size={18} /></div>
        <div className="footer-copy">
          <strong>Transparent. Accountable. Safer Coal Mines.</strong>
          <span>Integrated data • Real-time insights • Proactive governance</span>
        </div>
      </div>
    </div>
  );
}
