"use client";

import { useEffect, useMemo, useRef } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";

const LONG_PRESS_MS = 500;

// 이만큼(px) 이상 손가락이 움직이면 탭이 아니라 스크롤로 본다.
//
// 터치에서는 브라우저가 pointerdown이 일어난 요소에 암묵적으로 포인터 캡처를 건다.
// 그래서 목록을 스크롤하려고 영웅을 누른 채 손가락을 움직여도 pointerup이 결국
// 그 영웅에게 배달되고, 이동을 안 보면 그게 탭으로 처리돼 버린다.
// (pointerleave/pointercancel만 믿으면 안 되는 이유이기도 하다 — 캡처 때문에 안 올 수 있다.)
const MOVE_TOLERANCE_PX = 10;

// 짧게 누르면 onTap, LONG_PRESS_MS 이상 누르고 있으면 onLongPress.
// 손가락이 움직이면 둘 다 취소한다.
export function useLongPress(onTap: () => void, onLongPress: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const abortedRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useMemo(() => {
    function clearTimer() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    function abort() {
      clearTimer();
      abortedRef.current = true;
    }

    return {
      onPointerDown(e: ReactPointerEvent) {
        firedRef.current = false;
        abortedRef.current = false;
        startRef.current = { x: e.clientX, y: e.clientY };
        clearTimer();
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          if (abortedRef.current) return;
          firedRef.current = true;
          onLongPress();
        }, LONG_PRESS_MS);
      },

      onPointerMove(e: ReactPointerEvent) {
        const start = startRef.current;
        if (!start || abortedRef.current) return;
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_TOLERANCE_PX) {
          abort();
        }
      },

      onPointerUp() {
        clearTimer();
        const shouldTap = !firedRef.current && !abortedRef.current;
        startRef.current = null;
        if (shouldTap) onTap();
      },

      onPointerLeave: abort,
      onPointerCancel: abort,
      onContextMenu: (e: ReactMouseEvent) => e.preventDefault(),
    };
  }, [onTap, onLongPress]);
}
