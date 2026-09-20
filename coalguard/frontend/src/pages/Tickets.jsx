import { useEffect, useState } from 'react';
import api from '../lib/api';

const columns = [
  ['OPEN', 'Open'],
  ['ASSIGNED', 'Assigned'],
  ['IN_PROGRESS', 'In progress'],
  ['VERIFICATION', 'Verification'],
  ['CLOSED', 'Closed'],
];

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTickets = async () => {
    try {
      const response = await api.get('/api/tickets');
      setTickets(response.data.items || []);
      setError('');
    } catch {
      setError('Ticket service is unavailable. Start the backend to load the maintenance queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const moveTicket = async (ticket, status) => {
    try {
      const response = await api.patch(`/api/tickets/${ticket.id}`, { status, note: `Moved to ${status.toLowerCase()}.` });
      setTickets((items) => items.map((item) => item.id === ticket.id ? response.data : item));
    } catch {
      setError('The ticket could not be updated.');
    }
  };

  return (
    <main className="container tickets-page">
      <div className="flex-between mb-6 tickets-heading">
        <div>
          <p className="text-muted">Workforce response</p>
          <h1 className="text-3xl">Maintenance queue</h1>
          <p className="telemetry-subtitle">Every active ticket is traceable to the telemetry event that created it.</p>
        </div>
        <a href="/telemetry" className="btn-primary tickets-back-link">Back to telemetry</a>
      </div>

      {error && <div className="inline-error" role="alert">{error}</div>}
      {loading && <div className="card empty-state">Loading maintenance tickets...</div>}
      {!loading && !error && tickets.length === 0 && <div className="card empty-state">No corrective tickets yet. Inject a telemetry fault to create one.</div>}
      {!loading && tickets.length > 0 && (
        <section className="ticket-board">
          {columns.map(([status, label]) => {
            const columnTickets = tickets.filter((ticket) => ticket.status === status);
            return (
              <div className="ticket-column" key={status}>
                <div className="ticket-column-heading"><h2>{label}</h2><span>{columnTickets.length}</span></div>
                <div className="ticket-column-body">
                  {columnTickets.map((ticket) => (
                    <article className={`ticket-card ticket-${ticket.severity}`} key={ticket.id}>
                      <div className="flex-between"><span className="ticket-id">{ticket.id}</span><span className={`status-badge ${ticket.severity === 'critical' ? 'status-red' : 'status-orange'}`}>{ticket.severity}</span></div>
                      <h3>{ticket.title}</h3>
                      <p>{ticket.description}</p>
                      <div className="ticket-meta"><span>{ticket.assignee}</span><span>{new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                      {status !== 'CLOSED' && (
                        <select className="form-select ticket-select" value={status} onChange={(event) => moveTicket(ticket, event.target.value)} aria-label={`Move ${ticket.id}`}>
                          {columns.map(([value, optionLabel]) => <option value={value} key={value}>{optionLabel}</option>)}
                        </select>
                      )}
                    </article>
                  ))}
                  {columnTickets.length === 0 && <p className="ticket-column-empty">No tickets</p>}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
