/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Chromium out of the bundler; it is loaded from node_modules at runtime.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // The Chromium binaries (.br files) are read from disk at runtime, so file tracing
  // doesn't see them. Ship them with the route explicitly.
  outputFileTracingIncludes: {
    "/api/social/carousel": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
};
export default nextConfig;
