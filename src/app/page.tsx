"use client";

import Link from "next/link";
import { useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import {
  DialogActions,
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogKicker,
  DialogTitle,
} from "@/components/Dialog";

export default function Home() {
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  return (
    <div className="screen">
      <div className="app-header">
        <AppLogo size={52} />
        <div className="app-title">오버워치 친선전 밴픽 공유</div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 24px",
          gap: 14,
        }}
      >
        <div
          style={{
            font: "800 11px var(--font-heading)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
            marginBottom: 2,
          }}
        >
          START
        </div>

        <Link href="/create" className="btn btn-primary" style={{ padding: 22, gap: 16, justifyContent: "flex-start" }}>
          <PlusIcon />
          <span style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
            <span style={{ font: "800 18px var(--font-heading)" }}>방 만들기</span>
            <span style={{ font: "400 12px var(--font-body)", opacity: 0.85 }}>
              밴 개수를 정하고 링크를 나눠주세요
            </span>
          </span>
        </Link>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: 22, gap: 16, justifyContent: "flex-start" }}
          onClick={() => setShowJoinDialog(true)}
        >
          <EnterIcon />
          <span style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
            <span style={{ font: "800 18px var(--font-heading)" }}>입장하기</span>
            <span style={{ font: "400 12px var(--font-body)", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
              받은 초대 링크로 들어갑니다
            </span>
          </span>
        </button>
      </div>

      <div
        style={{
          padding: "16px 24px 26px",
          font: "400 11.5px/1.5 var(--font-body)",
          color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
          borderTop: "2px solid var(--color-divider)",
        }}
      >
        사설 방 밴픽 룰 공유용 · 로그인 없이 사용
      </div>

      {showJoinDialog && (
        <DialogBackdrop>
          <DialogContent>
            <DialogKicker>안내</DialogKicker>
            <DialogTitle>초대 링크로 입장해 주세요</DialogTitle>
            <DialogBody>
              친선전을 함께 할 분이 보내준 링크를 눌러야 방에 들어갈 수 있어요. 링크가 없다면 방을
              직접 만들어 상대에게 보내주세요.
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <button type="button" className="btn btn-secondary" onClick={() => setShowJoinDialog(false)}>
              닫기
            </button>
            <Link href="/create" className="btn btn-primary">
              방 만들기
            </Link>
          </DialogActions>
        </DialogBackdrop>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function EnterIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
    </svg>
  );
}
