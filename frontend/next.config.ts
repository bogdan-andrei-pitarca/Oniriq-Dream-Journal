import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
    const nextConfig = {
      env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL
      }
    }

export default nextConfig;
