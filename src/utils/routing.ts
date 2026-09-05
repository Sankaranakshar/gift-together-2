export interface ParsedRoute {
  view: 'landing' | 'create' | 'join' | 'group' | 'budget-form' | 'results' | 'payments' | 'choose-gift' | 'celebration';
  groupId: string | null;
  recoveryToken: string | null;
}

export function parseCurrentRoute(): ParsedRoute {
  // Support both pathname (e.g. /g/7xKp92LmQ) and hash (e.g. #/g/7xKp92LmQ)
  let path = window.location.pathname;
  if (window.location.hash && window.location.hash.startsWith('#/')) {
    path = window.location.hash.substring(1);
  }

  const urlParams = new URLSearchParams(window.location.search || (window.location.hash.includes('?') ? window.location.hash.split('?')[1] : ''));
  const recoveryToken = urlParams.get('token');
  const queryGroup = urlParams.get('group');

  if (queryGroup) {
    return { view: 'group', groupId: queryGroup, recoveryToken };
  }

  // Strip trailing slashes
  path = path.replace(/\/+$/, '') || '/';

  if (path === '/' || path === '') {
    return { view: 'landing', groupId: null, recoveryToken };
  }

  if (path === '/create') {
    return { view: 'create', groupId: null, recoveryToken };
  }

  if (path === '/join') {
    return { view: 'join', groupId: null, recoveryToken };
  }

  // /g/:groupId or /g/:groupId/:subview
  const groupMatch = path.match(/^\/g\/([^/?#]+)(?:\/([^/?#]+))?/);
  if (groupMatch) {
    const groupId = groupMatch[1];
    const subview = groupMatch[2];

    if (subview === 'join') {
      return { view: 'group', groupId, recoveryToken };
    }
    if (subview === 'budget') {
      return { view: 'budget-form', groupId, recoveryToken };
    }
    if (subview === 'results') {
      return { view: 'results', groupId, recoveryToken };
    }
    if (subview === 'payments') {
      return { view: 'payments', groupId, recoveryToken };
    }
    if (subview === 'choose-gift' || subview === 'choose') {
      return { view: 'choose-gift', groupId, recoveryToken };
    }
    if (subview === 'celebration' || subview === 'done') {
      return { view: 'celebration', groupId, recoveryToken };
    }
    return { view: 'group', groupId, recoveryToken };
  }

  return { view: 'landing', groupId: null, recoveryToken };
}

export function navigateTo(path: string, replace = false): void {
  try {
    if (replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
    // Dispatch popstate so listener triggers
    window.dispatchEvent(new PopStateEvent('popstate'));
  } catch {
    // If standard pushState fails in iframe, fallback to hash
    window.location.hash = path.startsWith('/') ? path : `/${path}`;
  }
}

export function getShareableGroupUrl(groupId: string): string {
  const origin = window.location.origin;
  return `${origin}/g/${groupId}`;
}

export function getRecoveryUrl(groupId: string, token: string): string {
  const origin = window.location.origin;
  return `${origin}/g/${groupId}?token=${token}`;
}
