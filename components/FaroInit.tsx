"use client";

// 2026-08-19: 브라우저에서 일어나는 일(버튼 클릭, 페이지 이동, JS 에러, 네트워크 요청 실패)을
// 자동으로 잡아서 Alloy Faro 수신기(Infra/modules/addons/alloy-faro)로 전송 → Loki에 저장 →
// Grafana에서 조회. 서버(middleware/SSR)나 백엔드 로그는 이걸로 안 잡힘 — 그건 Promtail이
// 컨테이너 stdout을 긁어서 별도로 Loki에 넣어줌 (Infra/modules/addons/promtail).
//
// NEXT_PUBLIC_FARO_COLLECTOR_URL이 없으면(로컬 개발 등) 그냥 아무 것도 안 하고 조용히 넘어감 —
// 로컬에선 Faro 수신기가 안 떠 있어서 에러만 나고 얻는 것도 없음.
import { useEffect } from "react";
import { initializeFaro, getWebInstrumentations } from "@grafana/faro-web-sdk";

export default function FaroInit() {
  useEffect(() => {
    const collectorUrl = process.env.NEXT_PUBLIC_FARO_COLLECTOR_URL;
    if (!collectorUrl) return;

    initializeFaro({
      url: collectorUrl,
      app: {
        name: "qket-frontend",
        version: "1.0.0",
        environment: process.env.NEXT_PUBLIC_APP_ENV ?? "local",
      },
      instrumentations: getWebInstrumentations(),
    });
  }, []);

  return null;
}
