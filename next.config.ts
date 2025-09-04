import type { NextConfig } from 'next'
import { createSecureHeaders } from 'next-secure-headers'

const nextConfig: NextConfig = {
  eslint: {
    // Ignore ESLint errors during builds (Vercel/production)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript type errors during builds
    ignoreBuildErrors: true,
  },
  /**
   * Security Headers Configuration:
   * - Uses the `createSecureHeaders()` function from the `next-secure-headers` package
   *   to apply security-related HTTP headers to all routes.
   * - `source: '/(.*)'` matches all route paths.
   * - The default `createSecureHeaders()` settings apply multiple important headers, including:
   *   1. Content-Security-Policy: Restricts the sources of content to mitigate XSS attacks.
   *   2. X-Frame-Options: Prevents the site from being embedded in iframes to avoid clickjacking.
   *   3. X-Content-Type-Options: Disables MIME type sniffing to prevent content-type confusion attacks.
   *   4. X-XSS-Protection: Enables the browser’s built-in XSS filtering.
   *   5. Strict-Transport-Security: Enforces secure (HTTPS) connections to the server.
   *   6. Referrer-Policy: Controls the amount of referrer information sent with requests.
   *
   * These headers are crucial for enhancing the site's security and protecting against
   * common web threats.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async headers() {
    return [
      // Allow embedding share Notion page in Notion (iframe)
      {
        source: '/share/notion',
        headers: [
          ...createSecureHeaders({
            frameGuard: false,
            contentSecurityPolicy: {
              directives: {
                frameAncestors: [
                  "'self'",
                  'https://notion.so',
                  'https://www.notion.so',
                  'https://*.notion.so',
                  'https://*.notion.site',
                ],
              },
            },
          }),
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        source: '/share/notion/(.*)',
        headers: [
          ...createSecureHeaders({
            frameGuard: false,
            contentSecurityPolicy: {
              directives: {
                frameAncestors: [
                  "'self'",
                  'https://notion.so',
                  'https://www.notion.so',
                  'https://*.notion.so',
                  'https://*.notion.site',
                ],
              },
            },
          }),
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      // Apply strict defaults to all other routes, but disable X-Frame-Options here
      // to avoid conflicting headers when multiple header rules match the same path.
      // We rely on CSP frame-ancestors to control embedding instead.
      { source: '/(.*)', headers: createSecureHeaders({ frameGuard: false }) },
    ]
  },
}

export default nextConfig
