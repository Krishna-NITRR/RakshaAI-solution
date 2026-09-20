import { useEffect, useState } from 'react';
import api from '../lib/api';

const forms = [
  ['form-iv-a', 'Form IV-A', 'Notice of Accident / Occurrence'],
  ['form-b', 'Form B', 'Monthly Safety Return'],
];

export default function Compliance() {
  const [form, setForm] = useState('form-iv-a');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadReport = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/dgms/preview?form=${form}`);
        if (!cancelled) {
          setReport(response.data);
          setError('');
        }
      } catch {
        if (!cancelled) setError('DGMS report service is unavailable.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadReport();
    return () => { cancelled = true; };
  }, [form]);

  return (
    <main className="container compliance-page">
      <div className="flex-between mb-6 compliance-heading">
        <div>
          <p className="text-muted">Statutory evidence workspace</p>
          <h1 className="text-3xl">DGMS compliance</h1>
          <p className="telemetry-subtitle">Live report preview assembled from telemetry, CV incidents, and corrective tickets.</p>
        </div>
        <a href="/telemetry" className="btn-primary compliance-back-link">Back to operations</a>
      </div>

      <div className="form-switcher" role="tablist" aria-label="DGMS forms">
        {forms.map(([value, label, subtitle]) => (
          <button className={`form-tab ${form === value ? 'form-tab-active' : ''}`} key={value} onClick={() => setForm(value)} role="tab" aria-selected={form === value}>
            <strong>{label}</strong><span>{subtitle}</span>
          </button>
        ))}
      </div>

      {error && <div className="inline-error" role="alert">{error}</div>}
      {loading && <div className="card empty-state">Generating statutory preview...</div>}
      {!loading && report && (
        <section className="compliance-layout">
          <article className="card report-paper">
            <div className="report-paper-header">
              <div><span className="report-seal">DGMS</span><div><p className="text-muted">Government safety record</p><h2>{report.title}</h2></div></div>
              <span className="status-badge status-orange">DEMO PREVIEW</span>
            </div>
            <div className="report-fields">
              {Object.entries(report.fields).map(([label, value]) => <div className="report-field" key={label}><span>{label}</span><strong>{String(value)}</strong></div>)}
            </div>
            <div className="report-signature"><span>Canonical report signature</span><code>{report.signature}</code></div>
          </article>
          <aside className="compliance-side">
            <div className="card">
              <p className="text-muted">Evidence ledger</p>
              <div className="evidence-counts">
                <div><strong>{report.evidence.incident_count}</strong><span>CV incidents</span></div>
                <div><strong>{report.evidence.ticket_count}</strong><span>Tickets</span></div>
                <div><strong>{report.evidence.hazard_count}</strong><span>Hazards</span></div>
              </div>
            </div>
            <div className="card report-actions">
              <p className="text-muted">Export</p>
              <h2 className="text-xl">Signed report package</h2>
              <p className="telemetry-subtitle">The PDF contains the canonical payload signature and current source evidence.</p>
              <a className="btn-primary" href={`${api.defaults.baseURL}/api/dgms/download?form=${form}`} target="_blank" rel="noreferrer">Download Signed DGMS PDF</a>
            </div>
            <div className="card warning-card">
              <p className="text-muted">Validation notes</p>
              {report.warnings.length ? report.warnings.map((warning) => <p key={warning}>! {warning}</p>) : <p className="safe-banner">All mandatory demo fields are populated.</p>}
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}
