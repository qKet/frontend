"use client";

// 전역 토스트 알림 — 브라우저 기본 alert()를 대체함(2026-08-21).
// alert()는 페이지 전체를 막는 네이티브 팝업이라 서비스 디자인과 안 어울리고, 사용자가 "확인"을
// 눌러야만 다음 동작으로 넘어갈 수 있어 UX가 딱딱함. 대신 화면 상단 중앙에 떴다 사라지는
// 배너로 안내하고, 페이지 이동 같은 후속 동작은 alert 응답을 기다리지 않고 바로 진행함.
//
// 실사용 테스트 결과 우측 상단 + 3초는 눈에 잘 안 띈다는 피드백이 있어서(2026-08-21),
// 화면 상단 중앙 + 더 큰 크기로 조정함. styles/toast.css 참고.
// 이후 2차 피드백: 4.5초는 오히려 길다 → 3.5초가 적당, 사라질 때는 나타날 때와 반대로
// 위로 슬라이드하며 사라지는 편이 자연스러움 → leaving 상태를 하나 더 둬서 CSS로 exit
// 애니메이션을 재생한 뒤(200ms) 실제로 배열에서 제거함.
//
// 사용법:
//   const toast = useToast();
//   toast.error("결제 취소에 실패했습니다.");
//   toast.success("저장되었습니다.");
//
// app/layout.tsx의 RootLayout에서 전체를 <ToastProvider>로 감싸서 어디서든 useToast()로 쓸 수 있음.
// 사용자가 "확인"을 눌러야만 다음 동작(로그인 페이지 이동 등)으로 넘어가야 하는 경우는 그대로
// window.confirm()을 쓰고, 단순 안내/에러 메시지만 이걸로 대체함.
//
// message에 줄바꿈(\n)이 있으면 첫 줄을 "제목"으로 크고 굵게, 나머지 줄을 "본문"으로 흐리고
// 작게 렌더링함(2026-08-21) — 예: BookButton의 "예매 오픈 전입니다\n현재 시각: ...\n오픈 시각: ..."
// 에서 정작 중요한 첫 줄이 시간 정보에 묻혀 안 보인다는 피드백이 있었음. 줄바꿈이 없는
// 한 줄짜리 메시지는 기존처럼 그대로 렌더링됨(변화 없음).
//
// 스팸 방지(2026-08-21): 버튼을 연타하면(예: 로그인 안 된 상태에서 예매하기를 계속 누름) 예전엔
// 누른 횟수만큼 토스트가 쌓였음. alert()로 돌아가지 않기 위해(확인 버튼으로 막는 방식은 원래
// 없애려던 블로킹 UX가 다시 생기는 것) "제한을 두는" 쪽으로 해결함 — 같은 메시지가 이미 떠 있으면
// 새로 쌓지 않고 그 토스트의 노출 타이머만 다시 3.5초로 늘려서 계속 보이게 하고(showToast 내부
// dedupe), 그것과 별개로 화면에 동시에 떠 있는 토스트 개수도 MAX_VISIBLE로 제한해서 서로 다른
// 메시지를 연타해도 화면이 도배되지 않게 함.

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastVariant = "error" | "success" | "info";

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
  leaving: boolean;
};

type ToastApi = {
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

// 첫 줄(제목) / 나머지 줄(본문)로 나눠서 렌더링. 줄바꿈이 없으면 그냥 메시지 하나만 반환.
function renderToastContent(message: string) {
  const [title, ...rest] = message.split("\n");
  if (rest.length === 0) return message;
  return (
    <>
      <div className="toastTitle">{title}</div>
      <div className="toastBody">{rest.join("\n")}</div>
    </>
  );
}

// 3.5초 — 짧은 안내문 기준. 오픈 시각처럼 정보량이 많은 메시지는 호출부에서 durationMs를 더 길게 줌.
const DEFAULT_DURATION_MS = 3500;

// 퇴장 애니메이션(toastOut, styles/toast.css) 재생 시간과 맞춤 — 이보다 짧으면 애니메이션이
// 끝나기 전에 DOM에서 사라져서 뚝 끊기는 것처럼 보임.
const EXIT_ANIM_MS = 200;

// 동시에 떠 있을 수 있는 최대 개수 — 넘으면 가장 오래된 것부터 즉시 내려서 화면이 도배되지 않게 함
const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  // 토스트별 "사라지기" 타이머 id — 같은 메시지가 다시 뜨면 이걸로 기존 타이머를 지우고 다시 걺
  const timersRef = useRef<Record<number, number>>({});

  const clearTimer = (id: number) => {
    const t = timersRef.current[id];
    if (t) {
      window.clearTimeout(t);
      delete timersRef.current[id];
    }
  };

  // 완전히 제거하기 전에 leaving 플래그만 켜서 exit 애니메이션(toastOut)을 재생시킴
  const startLeave = useCallback((id: number) => {
    clearTimer(id);
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_ANIM_MS);
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant, durationMs = DEFAULT_DURATION_MS) => {
      setToasts((prev) => {
        // 이미 같은 메시지가 떠 있으면 새로 쌓지 않고 그 토스트의 타이머만 갱신(연타 방지)
        const existing = prev.find((t) => t.message === message && t.variant === variant && !t.leaving);
        if (existing) {
          clearTimer(existing.id);
          timersRef.current[existing.id] = window.setTimeout(() => startLeave(existing.id), durationMs);
          return prev;
        }

        const id = ++idRef.current;
        timersRef.current[id] = window.setTimeout(() => startLeave(id), durationMs);

        // 동시 노출 개수 제한 — 넘치는 가장 오래된 토스트는 바로 제거(그 토스트의 타이머도 정리)
        const next = [...prev, { id, message, variant, leaving: false }];
        if (next.length > MAX_VISIBLE) {
          const overflow = next.splice(0, next.length - MAX_VISIBLE);
          overflow.forEach((t) => clearTimer(t.id));
        }
        return next;
      });
    },
    [startLeave]
  );

  const api: ToastApi = {
    success: (message, durationMs) => show(message, "success", durationMs),
    error: (message, durationMs) => show(message, "error", durationMs),
    info: (message, durationMs) => show(message, "info", durationMs),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toastContainer" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toastItem toast-${t.variant}${t.leaving ? " toastLeaving" : ""}`}
            onClick={() => startLeave(t.id)}
          >
            {renderToastContent(t.message)}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast()는 <ToastProvider> 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}
