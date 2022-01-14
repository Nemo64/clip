
interface Tracker {
  enabled: boolean;
  trackPageView: typeof trackPageView;
  trackEvent: typeof trackEvent;
}

const trackers: Record<string, Tracker> = {};

export function trackPageView(path: string) {
  console.log('trackPageView', path);
  Object.values(trackers).forEach(tracker => tracker.enabled && tracker.trackPageView(path));
}

export function trackEvent(category: string, action: string, name?: string, value?: number) {
  console.log('trackEvent', category, action, name, value);
  Object.values(trackers).forEach(tracker => tracker.enabled && tracker.trackEvent(category, action, name, value));
}

/**
 * Setup matomo tracker
 * @see https://developer.matomo.org/api-reference/tracking-api
 */
(() => {
  const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL;
  const SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;
  if (typeof MATOMO_URL !== 'string' || typeof SITE_ID !== 'string') {
    return;
  }

  if (typeof localStorage === 'undefined') {
    return;
  }

  const userId = (() => {
    let value = localStorage.getItem('_id');
    if (value && /^[0-9a-f]{16}$/.test(value)) {
      return value;
    }

    value = generateRandomHexString(16 / 2);
    localStorage.setItem('_id', value);
    return value;
  })();

  const track = (params: Record<string, string>) => fetch(
    `${MATOMO_URL}?${new URLSearchParams({idsite: SITE_ID, rec: '1', apiv: '1', rand: Math.random().toString(), _id: userId, ...params})}`,
    {cache: 'no-cache', mode: 'no-cors', method: 'HEAD'},
  );

  trackers['matomo'] = {
    get enabled() {
      return localStorage.getItem('matomo') !== 'false';
    },
    set enabled(value) {
      localStorage.setItem('matomo', value ? 'true' : 'false');
    },
    trackPageView: path => track({
      url: path,
      ua: navigator.userAgent,
      res: `${screen.width}x${screen.height}`,
    }),
    trackEvent: (category, action, name, value) => track({
      e_c: category,
      e_a: action,
      ...(name && {e_n: name}),
      ...(value && {e_v: value.toString()}),
    }),
  };
})();

function generateRandomHexString(numBytes: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(numBytes));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
