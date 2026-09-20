import { useEffect, useState } from 'react';
import api from '../lib/api';

const anomalyOptions = [
  ['BEARING_OVERHEAT', 'Bearing overheat'],
  ['METHANE_HIGH', 'Methane concentration'],
  ['ZONE_INTRUSION', 'Worker-zone intrusion'],
  ['VIBRATION_HIGH', 'Abnormal vibration'],
];

export default function SafetyIntelligence() {
  const [anomaly, setAnomaly] = useState('BEARING_OVERHEAT');
  const [graph, setGraph] = useState(null);
  const [question, setQuestion] = useState('What should we do about a methane leak?');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadGraph = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/rca/graph?anomaly=${anomaly}`);
        if (!cancelled) { setGraph(response.data); setError(''); }
      } catch {
        if (!cancelled) setError('Root-cause service is unavailable.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadGraph();
    return () => { cancelled = true; };
  }, [anomaly]);

  const askAssistant = async (event) => {
    event.preventDefault();
    setAsking(true);
    try {
      const response = await api.post('/api/ai/query', { question });
      setAnswer(response.data);
      setError('');
    } catch {
      setError('Safety assistant is unavailable.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <main className="container intelligence-page">
      <div className="flex-between mb-6 intelligence-heading">
        <div>
          <p className="text-muted">Explainable safety operations</p>
          <h1 className="text-3xl">Root cause intelligence</h1>
          <p className="telemetry-subtitle">Trace sensor anomalies to equipment consequences and cited Coal Mines Regulations.</p>
        </div>
        <a href="/telemetry" className="btn-primary intelligence-back-link">Back to operations</a>
      </div>
      {error && <div className="inline-error" role="alert">{error}</div>}

      <section className="intelligence-grid">
        <div className="card">
          <div className="flex-between mb-4"><div><p className="text-muted">Causal graph</p><h2 className="text-xl">Why this event matters</h2></div><select className="form-select anomaly-select" value={anomaly} onChange={(event) => setAnomaly(event.target.value)}>{anomalyOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
          {loading && <div className="empty-state">Tracing causal path...</div>}
          {!loading && graph && <>
            <div className="causal-path">{graph.nodes.map((node, index) => <div className="causal-step" key={node.id}><div className={`causal-node causal-${node.kind.replace(' ', '-')}`}><small>{node.kind}</small><strong>{node.label}</strong></div>{index < graph.nodes.length - 1 && <span className="causal-arrow">→</span>}</div>)}</div>
            <div className="citation-box"><span className="text-muted">Statutory basis</span><p>{graph.citation}</p></div>
          </>}
        </div>

        <div className="card assistant-card">
          <div><p className="text-muted">CMR 2017 assistant</p><h2 className="text-xl">Ask a safety question</h2></div>
          <form onSubmit={askAssistant} className="assistant-form"><textarea className="form-textarea" value={question} onChange={(event) => setQuestion(event.target.value)} rows="3" aria-label="Safety question" /><button className="btn-primary" disabled={asking || question.trim().length < 3}>{asking ? 'Checking statutory context...' : 'Ask assistant'}</button></form>
          {answer && <div className="assistant-answer"><p>{answer.answer}</p><span className="text-muted">Source: {answer.provider}</span>{answer.citations.map((citation) => <div className="assistant-citation" key={citation.regulation}><strong>{citation.regulation}</strong><span>{citation.text}</span></div>)}</div>}
        </div>
      </section>
    </main>
  );
}
