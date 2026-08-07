import type { NextConfig } from "next";
// @ts-ignore
import withPWAInit from "next-pwa";

const customRuntimeCaching = [
  {
    urlPattern: /^https?:\/\/.*\/api\/.*/i,
    handler: 'NetworkOnly',
  },
  {
    urlPattern: /.*/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'others',
      expiration: {
        maxEntries: 64,
        maxAgeSeconds: 24 * 60 * 60,
      },
      networkTimeoutSeconds: 20,
    },
  },
];

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: customRuntimeCaching,
  buildExcludes: [/middleware-manifest\.json$/],
});

import os from "os";

const getLocalIPs = () => {
  const interfaces = os.networkInterfaces();
  const origins: string[] = ["localhost", "localhost:3000", "127.0.0.1", "127.0.0.1:3000"];
  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (netList) {
      for (const net of netList) {
        if (net.family === "IPv4" && !net.internal) {
          origins.push(net.address);
          origins.push(`${net.address}:3000`);
        }
      }
    }
  }
  return origins;
};

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-ignore
  allowedDevOrigins: getLocalIPs(),
};

export default withPWA(nextConfig);
