const SESSION_KEY = 'coalguard_session';

export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    return session?.access_token ? session : null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem('token', session.access_token);
  window.dispatchEvent(new Event('auth-changed'));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('token');
  window.dispatchEvent(new Event('auth-changed'));
}

export function getInitials(name = '') {
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]);
  return initials.join('').toUpperCase() || '?';
}

export function getRoleLabel(role = '') {
  return role
    .replace(/^r-/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Mine Official';
}