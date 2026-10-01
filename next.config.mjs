/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Chromium out of the bundler; it is loaded from node_modules at runtime.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
};
export default nextConfig;
