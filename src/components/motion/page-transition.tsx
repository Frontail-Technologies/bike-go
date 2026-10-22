/**
 * Enter-only page transition: a 200ms fade and 6px rise, in pure CSS (see
 * `.rgo-page-in` in globals.css). It runs on the server-rendered markup, so it
 * never waits for JavaScript, never delays navigation, and is switched off by
 * the global reduced-motion rule. Use it from a route `template.tsx`, which
 * remounts on every navigation.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return <div className="rgo-page-in">{children}</div>;
}
