"use client";

// 브라우저 이벤트(클릭/페이지이동/JS 에러/네트워크 실패)를 Alloy Faro 수신기로 전송 → Loki →
// Grafana. 서버/백엔드 로그는 Promtail이 별도로 처리. NEXT_PUBLIC_FARO_COLLECTOR_URL이 없으면
// (로컬 등) 조용히 아무 것도 안 함.
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
