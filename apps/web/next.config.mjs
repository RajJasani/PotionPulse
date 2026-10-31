/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@potionpulse/contracts', '@potionpulse/ui-tokens'],
};

export default nextConfig;

