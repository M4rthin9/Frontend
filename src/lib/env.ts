/**
 * Which deployment is this bundle running in?
 *
 * `import.meta.env.PROD` is true for BOTH the production Pages deployment and
 * the dev one — `vite build` always sets it — so it cannot be used to tell them
 * apart. The deploy hostname is the only reliable signal available at runtime:
 *
 *   production   ccc-frontend.pages.dev  /  cida.dpdns.org
 *   development  dev.ccc-frontend.pages.dev
 *   local        localhost / 127.0.0.1
 */

const host = typeof location === 'undefined' ? '' : location.hostname;

/** True on the dev Pages deployment (the `dev` branch alias). */
export const isDevDeployment = host.startsWith('dev.');

/** True when served by `vite dev` on a developer machine. */
export const isLocal = host === 'localhost' || host === '127.0.0.1';

/**
 * Production is the only place the service worker should run. On dev its
 * cache-first strategy serves stale bundles and hides the change you just
 * shipped; locally it is never registered anyway.
 */
export const shouldRegisterServiceWorker = import.meta.env.PROD && !isDevDeployment && !isLocal;
