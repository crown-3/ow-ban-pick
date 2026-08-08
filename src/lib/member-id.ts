"use client";

import { useSyncExternalStore } from "react";

// 로그인이 없는 앱이라 "나"라는 개념은 브라우저에 저장된 uuid 하나로 대신한다.
// 방마다 별도로 저장해서, 같은 브라우저로 여러 방에 들어가도 서로 안 섞이게 한다.

function storageKey(roomId: string): string {
  return `ow-bp:${roomId}:memberId`;
}

export function getOrCreateMemberId(roomId: string): string {
  const key = storageKey(roomId);
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(key, id);
  return id;
}

export function clearMemberId(roomId: string): void {
  window.localStorage.removeItem(storageKey(roomId));
}

function subscribeNoop(): () => void {
  return () => {};
}

// localStorage는 이 탭 안에서는 바뀌지 않는 값이라 구독할 게 없다 — 서버 스냅샷(null)과
// 클라이언트 스냅샷(생성/조회된 id)만 구분하면 되므로 useSyncExternalStore로 SSR-안전하게 읽는다.
export function useMemberId(roomId: string): string | null {
  return useSyncExternalStore(
    subscribeNoop,
    () => getOrCreateMemberId(roomId),
    () => null
  );
}
