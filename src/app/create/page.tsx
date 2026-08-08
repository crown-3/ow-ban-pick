"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { Toggle } from "@/components/Toggle";
import { createRoom } from "@/lib/room-actions";
import type { BanCount } from "@/lib/supabase/types";

const BAN_COUNT_OPTIONS: BanCount[] = [2, 3, 4, 6];

export default function CreateRoomPage() {
  const router = useRouter();
  const [banCount, setBanCount] = useState<BanCount>(4);
  const [name, setName] = useState("");
  const [allowLockedBan, setAllowLockedBan] = useState(true);
  const [allowEditAfterSubmit, setAllowEditAfterSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const room = await createRoom({
        name: name.trim() || "친선전",
        banCount,
        allowLockedBan,
        allowEditAfterSubmit,
      });
      router.push(`/room?id=${room.id}`);
    } catch {
      setError("방을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="screen">
      <div className="app-header-compact">
        <AppLogo size={30} />
        <div className="app-title">오버워치 친선전 밴픽 공유</div>
      </div>

      <div style={{ padding: "24px 24px 0" }}>
        <div
          style={{
            font: "800 11px var(--font-heading)",
            letterSpacing: "0.1em",
            color: "var(--color-accent)",
            marginBottom: 8,
          }}
        >
          방 만들기
        </div>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>밴 개수를 정하세요</h1>
        <p style={{ color: "color-mix(in srgb, var(--color-text) 60%, transparent)", fontSize: 13 }}>
          각 팀이 상대에게 걸 수 있는 밴의 최대 개수입니다.
        </p>
      </div>

      <div
        style={{
          padding: "22px 24px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          borderTop: "2px solid var(--color-divider)",
          marginTop: 22,
        }}
      >
        {BAN_COUNT_OPTIONS.map((count) => {
          const active = count === banCount;
          return (
            <button
              key={count}
              type="button"
              onClick={() => setBanCount(count)}
              style={{
                all: "unset",
                cursor: "pointer",
                boxSizing: "border-box",
                border: `2px solid ${active ? "var(--color-accent)" : "var(--color-divider)"}`,
                background: active ? "var(--color-accent)" : "transparent",
                color: active ? "#f3f2f2" : "color-mix(in srgb, var(--color-text) 45%, transparent)",
                padding: "18px 0",
                textAlign: "center",
                font: "800 22px var(--font-heading)",
              }}
            >
              {count}
            </button>
          );
        })}
      </div>

      <div
        style={{
          padding: "0 24px",
          borderTop: "2px solid var(--color-divider)",
          marginTop: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 0",
            borderBottom: "1px solid color-mix(in srgb, var(--color-text) 25%, transparent)",
            gap: 12,
          }}
        >
          <div>
            <div style={{ font: "600 14px var(--font-body)" }}>방 이름</div>
            <div style={{ font: "400 11.5px var(--font-body)", color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
              상대에게 보이는 이름
            </div>
          </div>
          <input
            className="input"
            style={{ width: 150, textAlign: "left" }}
            placeholder="목요일 내전"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 0",
            borderBottom: "1px solid color-mix(in srgb, var(--color-text) 25%, transparent)",
          }}
        >
          <div>
            <div style={{ font: "600 14px var(--font-body)" }}>확정 밴 허용</div>
            <div style={{ font: "400 11.5px var(--font-body)", color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
              길게 눌러 무조건 올리기
            </div>
          </div>
          <Toggle checked={allowLockedBan} onChange={setAllowLockedBan} label="확정 밴 허용" />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" }}>
          <div>
            <div style={{ font: "600 14px var(--font-body)" }}>제출 후 수정</div>
            <div style={{ font: "400 11.5px var(--font-body)", color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
              상대 제출 전까지 되돌리기
            </div>
          </div>
          <Toggle checked={allowEditAfterSubmit} onChange={setAllowEditAfterSubmit} label="제출 후 수정" />
        </div>
      </div>

      <div style={{ marginTop: "auto", padding: "18px 24px 24px", borderTop: "2px solid var(--color-divider)" }}>
        {error && (
          <p style={{ color: "var(--color-accent-700)", fontSize: 13, marginBottom: 10 }}>{error}</p>
        )}
        <button
          type="button"
          className="btn btn-primary btn-block"
          style={{ padding: "18px 20px", fontSize: 16 }}
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? "만드는 중…" : "방 만들기"}
        </button>
      </div>
    </div>
  );
}
