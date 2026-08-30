// 프론트 ↔ 백엔드(Spring Boot) 통신 규칙
// - apiFetch("/events") → fetch("/api/events") → next.config.mjs rewrites가 백엔드로 전달
//   (백엔드 context-path가 /api라서 컨트롤러는 @RequestMapping("/events")만 적으면 됨)
// - credentials: "include"로 세션 쿠키 자동 전송 — 로그인 후 토큰을 따로 실어 보낼 필요 없음
// - 4xx/5xx는 ApiError를 throw(e.message로 처리, 필요하면 e.code로 분기)
// - GlobalResponseAdvice가 감싼 { success, data, timestamp } 응답은 unwrap()이 data만 꺼내줌 —
//   호출부는 포장 여부를 신경 안 써도 T 타입 그대로 받음

// 서버 컴포넌트에서 직접 백엔드 호출 시 사용
// 로컬: localhost:8080 / Docker(K8s): Dockerfile runner 스테이지에서 CLUSTER_IP 주입
export const BASE_URL = process.env.CLUSTER_IP ?? 'http://localhost:8080';

// apiFetch가 4xx/5xx일 때 던지는 에러. 기존처럼 e.message만 써도 되고,
// 백엔드가 ErrorCode 기반으로 응답한 경우엔 e.code로 분기 처리도 가능
export class ApiError extends Error {
  code?: string;
  status?: number;
  errors?: { field: string; value: string; reason: string }[];

  constructor(
    message: string,
    opts?: { code?: string; status?: number; errors?: ApiError["errors"] }
  ) {
    super(message);
    this.name = "ApiError";
    this.code = opts?.code;
    this.status = opts?.status;
    this.errors = opts?.errors;
  }
}

// apiFetch<T>(path, options) 사용법:
//   - body 에 객체 넣으면 자동 JSON.stringify
//   - 응답 자동 JSON 파싱 → T 타입으로 반환
//   - 4xx / 5xx 응답이면 백엔드 message 로 Error 자동 throw
//     → 페이지에서 catch(e) { setError(e.message) } 하면 끝
export async function apiFetch<T = unknown>(
  path: string,
  options?: Omit<RequestInit, "body"> & { body?: object }
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(data?.message ?? `요청 실패 (${res.status})`, {
      code: data?.code,
      status: data?.status ?? res.status,
      errors: data?.errors,
    });
  }

  return unwrap(data) as T;
}

// GlobalResponseAdvice가 감싼 { success, data, timestamp } 모양만 감지해서 data를 꺼냄 — 손으로
// 만든 Map({ success, user } 등)은 이 세 필드를 다 안 가지므로 안 건드림. apiFetch를 안 거치고
// 직접 fetch()를 쓰는 곳도 이 함수를 꼭 같이 써야 함(안 그러면 배열이 감싸져 오는 응답을 그대로
// 배열처럼 써서 런타임 에러가 남).
export function unwrap(data: unknown): unknown {
  if (
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "success" in data &&
    "data" in data &&
    "timestamp" in data
  ) {
    return (data as { data: unknown }).data;
  }
  return data;
}
