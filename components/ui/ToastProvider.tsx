"use client";

// 전역 토스트 알림 — 브라우저 기본 alert()를 대체함(페이지를 막지 않고 화면 상단 중앙에
// 떴다 사라지는 배너로 안내, 3.5초 후 슬라이드 아웃). "확인"을 눌러야만 다음 동작으로 넘어가야
// 하는 경우는 그대로 window.confirm() 사용.
//
// 사용법: const toast = useToast(); toast.error("..."); toast.success("...");
// app/layout.tsx에서 <ToastProvider>로 감싸서 어디서든 useToast()로 씀.
//
// message에 줄바꿈(\n)이 있으면 첫 줄을 제목(크고 굵게), 나머지를 본문(흐리고 작게)으로 렌더링.
// 같은 메시지 연타 시 새로 안 쌓고 노출 타이머만 갱신(dedupe), 동시 노출 개수는 MAX_VISIBLE로 제한.

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
