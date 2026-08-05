/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Next.js는 동적 렌더링 페이지도 클라이언트 라우터 캐시에 기본 30초 보관함
  // (<Link>/router.push로 이동 시 서버에 새로 안 물어보고 예전 화면을 그대로 보여줌).
  // 관리자 화면에서 데이터를 바꾸고 다른 페이지로 이동하면 바로 반영 안 되는 문제라
  // dynamic 캐시를 꺼서 항상 최신 데이터를 다시 받아오게 함
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
  async rewrites() {
    const backendUrl = process.env.CLUSTER_IP || 'http://localhost:8080';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
