export type RouteName = 'home' | 'booking' | 'status';

const validRoutes = new Set<string>(['home', 'booking', 'status']);

function parseHash(): void {
  const raw = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  const seg = (raw || 'home').split('?')[0].split('/')[0] || 'home';
  router.route = validRoutes.has(seg) ? (seg as RouteName) : 'home';
}

class Router {
  route = $state<RouteName>('home');

  navigate(path: string): void {
    const target = path.startsWith('#/') ? path : `#/${path}`;
    if (window.location.hash === target) {
      parseHash();
    } else {
      window.location.hash = target;
    }
  }
}

export const router = new Router();

export function navigate(path: string): void {
  router.navigate(path);
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', parseHash);
  parseHash();
}
