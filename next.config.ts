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
    return [{ source: '/(.*)', headers: createSecureHeaders() }]
  },
}

export default nextConfig
