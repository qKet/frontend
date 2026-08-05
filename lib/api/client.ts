// ============================================================
// 이 프로젝트에서 프론트 ↔ 백엔드(Spring Boot)가 통신하는 방법
// ============================================================
//
// 1) 요청 흐름
//    React 컴포넌트 → apiFetch("/events") 호출
//    → 실제로는 fetch("/api/events") 를 보냄
//    → next.config.mjs 의 rewrites 설정이 "/api/*" 를 백엔드 주소로 그대로 전달
//      (로컬: http://localhost:8080/api/events)
//    → Spring Boot 는 application.yml 에 context-path: /api 로 되어 있어서
//      컨트롤러에 @RequestMapping("/events") 라고만 적어도 실제 주소는 /api/events 가 됨
//
// 2) 로그인 상태 유지 (세션 쿠키)
//    apiFetch 는 항상 credentials: "include" 로 요청을 보냄
//    → 로그인 성공(POST /api/auth/login) 시 브라우저가 세션 쿠키를 저장해두고,
//      그 뒤로 보내는 모든 apiFetch 요청에 그 쿠키가 자동으로 실려감
//    → 백엔드는 컨트롤러 메서드 파라미터에 HttpSession session 을 받아서
//      session.getAttribute("loginUser") 로 로그인한 유저를 꺼내 씀
//    → 즉 프론트에서 매번 토큰을 실어 보낼 필요 없음, 쿠키가 알아서 해줌
//
// 3) 백엔드 컨트롤러를 새로 만들 때 기본 형태 (예시)
//    @RestController
//    @RequestMapping("/example")          // 실제 주소는 /api/example
//    public class ExampleController {
//
//        @PostMapping                     // POST /api/example
//        public ResponseEntity<?> create(@RequestBody ExampleDTO dto, HttpSession session) {
//            // dto 필드 이름은 프론트에서 body 로 보낸 JSON의 key와 정확히 같아야 함
//            // (대소문자까지 일치. 예: { "userNm": "..." } ↔ dto.getUserNm())
//            ...
//            return ResponseEntity.ok(Map.of("success", true));
//        }
//    }
//    → 프론트 쪽 대응 코드는 apiFetch<ResultType>("/example", { method: "POST", body: dto })
//
// 4) 프론트가 백엔드 응답을 처리하는 규칙
//    - 백엔드가 200번대 응답을 주면 → apiFetch 가 자동으로 JSON 파싱해서 반환
//    - 백엔드가 4xx/5xx 를 주면 → apiFetch 가 ApiError를 throw 함
//      → 호출부에서 그냥 catch(e) { setError(e.message) } 만 해도 예전처럼 동작하고,
//        필요하면 e.code 로 분기 처리도 가능 (예: e.code === "A002" 면 정지 계정 전용 안내)
//    - 백엔드가 BusinessException(ErrorCode.XXX)을 던진 곳은 { status, code, message, errors, timestamp }
//      형태(ErrorResponse)로 옴. 아직 마이그레이션 안 된 곳(회원가입, 관리자 API 등)은
//      예전처럼 { success:false, message } 형태로 옴 — 둘 다 e.message는 항상 채워지므로 안전함
//
// 5) 백엔드 GlobalResponseAdvice 자동 포장 처리
//    새로 만드는 컨트롤러가 그냥 데이터(List, DTO 등)만 리턴하면, 백엔드의 GlobalResponseAdvice가
//    자동으로 { success, message, data, timestamp } 형태로 감싸서 내려보냄.
//    apiFetch는 이 모양을 감지하면 data 필드만 꺼내서 돌려주기 때문에, 호출하는 쪽(예: getEvents())은
//    이런 포장이 있는지 신경 쓸 필요 없이 예전처럼 T 타입을 그대로 받으면 됨.
//    (반면 로그인/회원가입처럼 컨트롤러가 이미 직접 Map으로 success/message를 만들어 리턴하는 곳은
//     이 포장을 안 거치므로 지금처럼 그대로 최상위 필드로 옴)
// ============================================================

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

// GlobalResponseAdvice가 감싼 { success, message, data, timestamp } 모양이면 data만 꺼냄.
// success/data/timestamp 세 필드가 동시에 있는 경우만 감지 — 기존 컨트롤러들이 손으로 만든
// Map(예: { success, user }, { success, reservations })은 이 세 필드를 다 가지진 않으므로 안 건드림
//
// apiFetch를 안 거치고 직접 fetch()를 쓰는 곳(예: 서버 컴포넌트에서 절대경로 URL로 호출하는 경우)이 있다면
// 거기서도 이 함수를 그대로 가져다 써야 함 — 안 그러면 이번에 겪은 "performances.map is not a function" 같은
// 버그가 남 (백엔드가 배열을 감싸서 주기 시작했는데 프론트가 그걸 모르고 그대로 배열처럼 쓰는 경우)
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
