/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async headers() {
    return [
      {
        source: '/api/:path*',
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
          }
        ]
      },
      {
        source: '/webapp/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ]
      }
    ]
  },
  async redirects() {
    return [
      // Принудительный редирект с www на корень домена
      {
        source: '/:path*',
        has: [
          { type: 'host', value: 'www.anonimka.online' }
        ],
        destination: 'https://anonimka.online/:path*',
        permanent: true
      }
    ]
  },
  async rewrites() {
    return [
      // Корневая страница отдаёт legacy SPA из /webapp/
      {
        source: '/',
        destination: '/webapp/index.html'
      }
    ]
  }
}

module.exports = nextConfig