/* Optional bridge for browser CV results; local persistence remains authoritative offline. */
function makeSyncId(prefix = 'cv') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function sendCvIncident(payload, apiUrl = '') {
  apiUrl = apiUrl || window.KHAAN_API_URL || (window.location.port === '8080' ? 'http://127.0.0.1:8000' : '');
  const item = { ...payload, type: 'cv_incident', temp_uuid: payload.temp_uuid || makeSyncId() };
  try {
    const response = await fetch(`${apiUrl}/api/alerts/cv-incident`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
    if (!response.ok) throw new Error(`CV bridge returned ${response.status}`);
    return await response.json();
  } catch (error) {
    window.KhaanSyncQueue?.enqueueSync(item);
    return { queued: true, error: error.message, temp_uuid: item.temp_uuid };
  }
}

window.KhaanApiBridge = { sendCvIncident };