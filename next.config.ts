import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 生产环境优化配置
  experimental: {
    serverActions: {
      // 生产环境下限制允许的域名，开发环境允许所有
      allowedOrigins: process.env.NODE_ENV === 'production' 
        ? [process.env.VERCEL_URL || 'https://your-app.vercel.app']
        : ["*"]
    }
  },
  
  // 图片优化配置
  images: {
    domains: ['sns-webpic-qc.xhscdn.com', 'ci.xiaohongshu.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.xhscdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ci.xiaohongshu.com',
        port: '',
        pathname: '/**',
      }
    ]
  },

  // 性能优化 (Next.js 15+ 默认启用SWC minify)
  
  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // 输出配置
  output: 'standalone',
  
  // 禁用构建时的ESLint和TypeScript检查 (生产部署)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // 安全头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          }
        ],
      }
    ];
  },

  // 性能优化配置
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  reactStrictMode: true,
  
  // 在开发模式下的特定配置
  ...(process.env.NODE_ENV === 'development' && {
    assetPrefix: undefined,
    async rewrites() {
      return []
    }
  })
};

export default nextConfig;
