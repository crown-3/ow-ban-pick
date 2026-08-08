import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages에 정적 사이트로 올린다. 이 앱은 서버가 할 일이 없다 —
  // 데이터는 전부 브라우저에서 Supabase로 직접 오간다 (서버 컴포넌트 fetch,
  // API 라우트, 미들웨어, 서버 액션 모두 없음).
  output: "export",

  // 정적 export에서는 next/image의 기본 로더(서버에서 도는 최적화)를 못 쓴다.
  // 영웅 아이콘은 이미 40×40 수준의 작은 webp라 최적화가 필요 없다.
  images: { unoptimized: true },
};

export default nextConfig;
