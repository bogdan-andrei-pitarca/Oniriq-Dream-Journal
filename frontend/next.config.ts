import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
    const nextConfig = {
      output: 'standalone', // if you want standalone output
      env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
      }
    }

export default nextConfig;
