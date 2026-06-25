import type { NextConfig } from "next";
// @ts-ignore
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-ignore
  allowedDevOrigins: ['192.168.100.51', '192.168.100.51:3000'],
};

export default withPWA(nextConfig);
