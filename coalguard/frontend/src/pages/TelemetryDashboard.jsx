import { useEffect, useMemo, useState } from 'react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../lib/api';

const assetId = 'conveyor-07';
const faultLabels = {
  'bearing-thermal-surge': 'Bearing thermal surge',
  'methane-leak': 'Methane leak',
  'worker-zone-intrusion': 'Worker zone intrusion',
};

function toChartPoint(event) {
  const asset = event.assets?.find((item) => item.asset_id === assetId) || event.assets?.[0];
  if (!asset) return null;
  return {
    time: new Date(event.generated_at).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
    methane: asset.values.methane_ch4,
    temperature: asset.values.bearing_temperature,
    vibration: asset.values.vibration,
    dust: asset.values.dust,
  };
}

export default function TelemetryDashboard() {
  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState([]);
  const [faults, setFaults] = useState({});
  const [rul, setRul] = useState(null);
  const [rulHistory, setRulHistory] = useState([]);
  const [cvIncidents, setCvIncidents] = useState([]);
  const [connection, setConnection] = useState('connecting');
  const [error, setError] = useState('');

  useEffect(() => {
    let socket;
    let cancelled = false;
    let reconnectTimer;
    let reconnectDelay = 1000;

    const loadPrediction = async (currentAsset) => {
      try {
        const response = await api.post('/api/ml/predict-rul', {
          asset_id: currentAsset.asset_id,
          sensor_values: currentAsset.values,
        });
        if (cancelled) return;
        setRul(response.data);
        setRulHistory((points) => [...points, {
          time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
          health: response.data.health_index,
          rul: response.data.rul_hours,
        }].slice(-24));
      } catch {
        if (!cancelled) setError('RUL engine is unavailable. Raw telemetry remains live.');
      }
    };

    const loadInitialState = async () => {
      try {
        const [snapshotResponse, historyResponse] = await Promise.all([
          api.get('/telemetry/snapshot'),
          api.get('/telemetry/history?limit=24'),
        ]);
        if (cancelled) return;
        const current = snapshotResponse.data.assets.find((item) => item.asset_id === assetId) || snapshotResponse.data.assets[0];
        setAsset(current);
        setFaults(snapshotResponse.data.faults || {});
        setHistory(historyResponse.data.items.map(toChartPoint).filter(Boolean));
        const incidentResponse = await api.get('/api/alerts/cv-incidents');
        setCvIncidents(incidentResponse.data.items || []);
        await loadPrediction(current);
      } catch {
        if (!cancelled) setError('Telemetry API is unavailable. Start the backend to enable live data.');
      }
    };

    const connect = () => {
      const wsUrl = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/telemetry`;
      socket = new WebSocket(wsUrl);
      socket.onopen = () => {
        if (!cancelled) { setConnection('live'); reconnectDelay = 1000; }
      };
      socket.onmessage = (message) => {
        let event;
        try { event = JSON.parse(message.data); } catch { return; }
        if (cancelled) return;
        if (event.type === 'fault_state') {
          setFaults(event.faults || {});
          return;
        }
        if (event.type === 'cv_incident') {
          setCvIncidents((items) => [event.incident, ...items.filter((item) => item.id !== event.incident.id)].slice(0, 6));
          return;
        }
        const current = event.assets?.find((item) => item.asset_id === assetId) || event.assets?.[0];
        if (!current) return;
        setAsset(current);
        loadPrediction(current);
        const point = toChartPoint(event);
        if (point) setHistory((points) => [...points, point].slice(-24));
      };
      socket.onerror = () => {
        if (!cancelled) setConnection('offline');
      };
      socket.onclose = () => {
        if (!cancelled) { setConnection('offline'); reconnectTimer = window.setTimeout(connect, reconnectDelay); reconnectDelay = Math.min(reconnectDelay * 2, 10000); }
      };
    };

    loadInitialState();
    connect();
    return () => {
      cancelled = true;
      socket?.close();
      window.clearTimeout(reconnectTimer);
    };
  }, []);

  const activeHazards = asset?.hazards || [];
  const chartData = useMemo(() => history.length ? history : [{ time: '--', methane: 0, temperature: 0, vibration: 0, dust: 0 }], [history]);
  const rulData = useMemo(() => rulHistory.length ? rulHistory : [{ time: '--', health: 0, rul: 0 }], [rulHistory]);

  const toggleFault = async (faultType) => {
    const enabled = !faults[faultType];
    try {
      const response = await api.post(`/telemetry/faults/${faultType}`, { enabled });
      setFaults(response.data);
      setError('');
    } catch {
      setError('Unable to change the demo fault state.');
    }
  };

  return (
    <main className="container telemetry-page">
      <div className="flex-between mb-6 telemetry-heading">
        <div>
          <p className="text-muted">CoalGuard live operations</p>
          <h1 className="text-3xl">Underground telemetry</h1>
          <p className="telemetry-subtitle">{asset?.name || 'Loading asset stream'} · {asset?.zone || 'Connecting to sensor network'}</p>
        </div>
        <span className={`connection-pill connection-${connection}`}>
          <span className="connection-dot" /> {connection === 'live' ? 'Live stream' : connection}
        </span>
        <a href="/tickets" className="btn-primary telemetry-tickets-link">Maintenance queue</a>
        <a href="/compliance" className="btn-primary telemetry-tickets-link">DGMS compliance</a>
        <a href="/safety-intelligence" className="btn-primary telemetry-tickets-link">RCA assistant</a>
        <a href="/digital-twin" className="btn-primary telemetry-tickets-link">Digital twin</a>
      </div>

      {error && <div className="inline-error" role="alert">{error}</div>}

      <section className="telemetry-grid">
        <div className="card telemetry-chart-card">
          <div className="flex-between mb-4">
            <div>
              <p className="text-muted">Sensor trend</p>
              <h2 className="text-xl">Conveyor 07 signal history</h2>
            </div>
            <span className={`status-badge ${asset?.status === 'red' ? 'status-red' : asset?.status === 'yellow' ? 'status-orange' : 'status-green'}`}>
              {(asset?.status || 'green').toUpperCase()}
            </span>
          </div>
          <div className="telemetry-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#e85d04" dot={false} name="Bearing °C" strokeWidth={2} />
                <Line yAxisId="left" type="monotone" dataKey="methane" stroke="#c1121f" dot={false} name="Methane %" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="vibration" stroke="#2563eb" dot={false} name="Vibration mm/s" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <p className="text-muted">Current readings</p>
          <div className="reading-list">
            {[
              ['Methane CH4', asset?.values.methane_ch4, '%'],
              ['CO concentration', asset?.values.co_ppm, 'ppm'],
              ['Bearing temperature', asset?.values.bearing_temperature, '°C'],
              ['Vibration', asset?.values.vibration, 'mm/s'],
              ['Dust', asset?.values.dust, 'mg/m³'],
            ].map(([label, value, unit]) => (
              <div className="reading-row" key={label}>
                <span>{label}</span><strong>{value ?? '--'} <small>{unit}</small></strong>
              </div>
            ))}
          </div>
          <div className="hazard-stack">
            {activeHazards.length ? activeHazards.map((hazard) => (
              <div className={`hazard-banner hazard-${hazard.severity}`} key={hazard.code}>{hazard.message}</div>
            )) : <div className="safe-banner">All monitored signals are within operating range.</div>}
          </div>
        </div>
      </section>

      <section className="telemetry-secondary-grid">
        <div className="card rul-card">
          <div className="flex-between mb-4">
            <div>
              <p className="text-muted">Predictive maintenance</p>
              <h2 className="text-xl">Equipment health index</h2>
            </div>
            <span className={`status-badge ${rul?.status === 'critical' ? 'status-red' : rul?.status === 'warning' ? 'status-orange' : 'status-green'}`}>
              {(rul?.status || 'calculating').toUpperCase()}
            </span>
          </div>
          <div className="rul-summary">
            <div className="rul-gauge" style={{ '--health': `${rul?.health_index || 0}%` }}>
              <div><strong>{rul?.health_index ?? '--'}%</strong><small>health</small></div>
            </div>
            <div>
              <p className="text-muted">Estimated remaining useful life</p>
              <strong className="rul-hours">{rul?.rul_hours ?? '--'} <small>hours</small></strong>
              <p className="telemetry-subtitle">Confidence {rul ? `${Math.round(rul.confidence * 100)}%` : '--'} · {rul?.model_version || 'waiting for model'}</p>
            </div>
          </div>
          <div className="rul-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rulData}>
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="health" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="rul" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line yAxisId="health" type="monotone" dataKey="health" stroke="#0f766e" dot={false} name="Health %" strokeWidth={2} />
                <Line yAxisId="rul" type="monotone" dataKey="rul" stroke="#7c3aed" dot={false} name="RUL hours" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <p className="text-muted">Leading stress factors</p>
          <h2 className="text-xl mb-4">Why the score moved</h2>
          <div className="factor-list">
            {(rul?.contributions || []).map((factor) => (
              <div className="factor-row" key={factor.factor}>
                <span>{factor.factor}</span>
                <span className={`status-badge ${factor.impact === 'high' ? 'status-red' : factor.impact === 'moderate' ? 'status-orange' : 'status-green'}`}>{factor.impact}</span>
              </div>
            ))}
            {!rul && <p className="text-muted">Waiting for the first prediction.</p>}
          </div>
        </div>
      </section>

      <section className="card cv-panel">
        <div className="flex-between mb-4">
          <div>
            <p className="text-muted">Khaan Netra vision bridge</p>
            <h2 className="text-xl">Live safety incidents</h2>
          </div>
          <a href="/khaan-netra/index.html" target="_blank" rel="noreferrer" className="btn-primary cv-open-link">Open camera</a>
        </div>
        <div className="cv-layout">
          <div className="camera-frame">
            <div className="camera-grid" />
            <span className="camera-label">EDGE CAMERA / GALLERY B</span>
            {cvIncidents[0]?.detections?.[0]?.bbox && <div className="detection-box" style={{ left: `${Math.min(80, cvIncidents[0].detections[0].bbox[0] / 4)}%`, top: `${Math.min(65, cvIncidents[0].detections[0].bbox[1] / 4)}%` }}><span>{cvIncidents[0].detections[0].incident_type} {Math.round(cvIncidents[0].detections[0].confidence * 100)}%</span></div>}
            {!cvIncidents.length && <p className="camera-empty">Waiting for a CV incident snapshot...</p>}
          </div>
          <div className="cv-incident-list">
            {cvIncidents.length ? cvIncidents.map((incident) => (
              <div className="cv-incident" key={incident.id}>
                <div className="flex-between"><strong>{incident.id}</strong><span className="status-badge status-red">OPEN</span></div>
                <p>{incident.detections.map((detection) => `${detection.incident_type} (${Math.round(detection.confidence * 100)}%)`).join(', ')}</p>
                <small>Worker {incident.worker_id} · {incident.asset_id}</small>
              </div>
            )) : <p className="text-muted">No incidents received.</p>}
          </div>
        </div>
      </section>

      <section className="card demo-panel">
        <div>
          <p className="text-muted">Judge mode</p>
          <h2 className="text-xl">Inject a live incident</h2>
          <p className="telemetry-subtitle">Faults affect the same stream consumed by dashboards and future RUL workflows.</p>
        </div>
        <div className="fault-controls">
          {Object.entries(faultLabels).map(([faultType, label]) => (
            <button className={`fault-button ${faults[faultType] ? 'fault-active' : ''}`} key={faultType} onClick={() => toggleFault(faultType)}>
              <span className="fault-indicator" /> {faults[faultType] ? `Clear ${label}` : `Inject ${label}`}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
