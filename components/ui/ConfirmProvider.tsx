"use client";

// 전역 확인창 — 브라우저 기본 confirm()을 대체함(2026-08-21).
// confirm()도 alert()처럼 화면 전체를 막는 네이티브 팝업이라 디자인과 안 어울리고, 작고 눈에
// 잘 안 띈다는 피드백이 있었음. 대신 화면 중앙에 뜨는 모달로 안내하고, Promise<boolean>을
// 반환해서 호출부에서는 window.confirm()과 거의 똑같이 `await`로 쓰면 됨.
//
// 사용법:
//   const confirm = useConfirm();
//   const ok = await confirm("정말 삭제하시겠습니까?");
//   if (!ok) return;
//
// app/layout.tsx의 RootLayout에서 전체를 <ConfirmProvider>로 감싸서 어디서든 useConfirm()으로 씀.

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ConfirmOptions = {
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean; // true면 확인 버튼을 빨간색(위험한 동작, 예: 삭제)으로 표시
};

type ConfirmApi = (message: string, options?: ConfirmOptions) => Promise<boolean>;

type PendingConfirm = {
  message: string;
  options?: ConfirmOptions;
  resolve: (result: boolean) => void;
};

const ConfirmContext = createContext<ConfirmApi | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback<ConfirmApi>((message, options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ message, options, resolve });
    });
  }, []);

  const respond = (result: boolean) => {
    pending?.resolve(result);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className="confirmOverlay" onClick={() => respond(false)}>
          <div
            className="confirmModal"
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="confirmMessage">{pending.message}</p>
            <div className="confirmActions">
              <button type="button" className="confirmBtn confirmCancel" onClick={() => respond(false)}>
                {pending.options?.cancelLabel ?? "취소"}
              </button>
              <button
                type="button"
                className={`confirmBtn ${pending.options?.danger ? "confirmDanger" : "confirmOk"}`}
                onClick={() => respond(true)}
              >
                {pending.options?.confirmLabel ?? "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmApi {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm()은 <ConfirmProvider> 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}
