import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function DigitalTwin() {
  const [state, setState] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await api.get('/api/digital-twin/state');
        if (!cancelled) { setState(response.data); setError(''); }
      } catch {
        if (!cancelled) setError('Digital twin service is unavailable.');
      }
    };
    load();
    const timer = window.setInterval(load, 2000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  return (
    <main className="container twin-page">
      <div className="flex-between mb-6 twin-heading">
        <div>
          <p className="text-muted">Spatial operations layer</p>
          <h1 className="text-3xl">Underground digital twin</h1>
          <p className="telemetry-subtitle">Live gallery risk, equipment health, and worker-zone context.</p>
        </div>
        <a href="/telemetry" className="btn-primary twin-back-link">Back to operations</a>
      </div>
      {error && <div className="inline-error" role="alert">{error}</div>}
      <section className="twin-layout">
        <div className="card twin-map-card">
          <div className="twin-legend"><span><i className="legend-dot legend-green" /> Normal</span><span><i className="legend-dot legend-yellow" /> Watch</span><span><i className="legend-dot legend-red" /> Hazard</span><span><i className="worker-dot" /> Worker</span></div>
          <div className="twin-map">
            {state?.zones.map((zone) => <div className={`twin-zone zone-${zone.risk}`} key={zone.id} style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}><span>{zone.label}</span></div>)}
            {state?.assets.map((asset) => <button className={`twin-asset asset-${asset.status} ${selected?.id === asset.id ? 'asset-selected' : ''}`} key={asset.id} style={{ left: `${asset.x}%`, top: `${asset.y}%` }} onClick={() => setSelected(asset)} title={`Inspect ${asset.label}`}><span className="asset-pulse" /><span className="asset-icon">◆</span><small>{asset.label}</small></button>)}
            {state?.workers.map((worker) => <div className="twin-worker" key={worker.id} style={{ left: `${worker.x}%`, top: `${worker.y}%` }} title={`${worker.name} / ${worker.id}`}><span>●</span><small>{worker.id}</small></div>)}
            {!state && <div className="twin-loading">Loading spatial state...</div>}
          </div>
        </div>
        <aside className="twin-side">
          <div className="card">
            <p className="text-muted">Selected node</p>
            {selected ? <><h2 className="text-xl">{selected.label}</h2><span className={`status-badge ${selected.status === 'red' ? 'status-red' : selected.status === 'yellow' ? 'status-orange' : 'status-green'}`}>{selected.status.toUpperCase()}</span><div className="twin-values">{Object.entries(selected.values).map(([key, value]) => <div key={key}><span>{key.replaceAll('_', ' ')}</span><strong>{value}</strong></div>)}</div>{selected.hazards.map((hazard) => <div className="hazard-banner hazard-high" key={hazard.code}>{hazard.message}</div>)}</> : <p className="text-muted twin-empty">Select an equipment node on the gallery map.</p>}
          </div>
          <div className="card"><p className="text-muted">Worker presence</p><div className="worker-list">{state?.workers.map((worker) => <div key={worker.id}><span className="worker-dot" /> <strong>{worker.name}</strong><small>{worker.id} · {worker.status}</small></div>)}</div></div>
        </aside>
      </section>
    </main>
  );
}
