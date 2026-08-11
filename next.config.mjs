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
  // 2026-08-11: /api/* 프록시를 여기(rewrites)가 아니라 ALB Ingress의 path 라우팅으로 옮김
  // (Infra/02_k8s-addon의 kubernetes_ingress_v1.app_ingress — /api는 backend Service로 직접,
  // 나머지는 frontend Service로). 이유: rewrites()는 output:"standalone" 빌드에서 next build
  // 시점에 값이 고정돼버려서, CLUSTER_IP를 CI 빌드 환경에도 넣어줘야 하는 문제가 있었음
  // (frontend 레포 CI가 K8s 서비스 이름을 알아야 하는 게 부자연스러움). ALB가 path로 바로
  // 나눠주면 브라우저→백엔드 경로에 Next.js 서버가 아예 안 끼어서 이 문제 자체가 사라짐.
  // (서버 컴포넌트가 SSR 시점에 백엔드를 직접 호출하는 lib/api/client.ts의 BASE_URL은 이거랑
  // 무관 — 그쪽은 K8s Deployment env(CLUSTER_IP)를 런타임에 정상적으로 읽음, 그대로 유지)
};

export default nextConfig;
