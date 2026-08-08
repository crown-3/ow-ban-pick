"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { joinTeam } from "@/lib/room-actions";
import { teamColor } from "@/lib/teams";
import type { RoomMemberRow, RoomRow, Team } from "@/lib/supabase/types";

export function TeamSelectScreen({
  room,
  members,
  roomId,
  memberId,
}: {
  room: RoomRow;
  members: RoomMemberRow[];
  roomId: string;
  memberId: string;
}) {
  const router = useRouter();
  const [joining, setJoining] = useState<Team | null>(null);
  const [copied, setCopied] = useState(false);

  const team1Count = members.filter((m) => m.team === 1).length;
  const team2Count = members.filter((m) => m.team === 2).length;

  async function pickTeam(team: Team) {
    setJoining(team);
    try {
      await joinTeam(roomId, memberId, team);
    } finally {
      setJoining(null);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="screen">
      <div className="app-header">
        <AppLogo size={52} />
        <div className="app-title">오버워치 친선전 밴픽 공유</div>
      </div>

      <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ font: "800 11px var(--font-heading)", letterSpacing: "0.1em", color: "var(--color-accent)" }}>
          {room.name} · 밴 {room.ban_count}
        </div>
        <div style={{ font: "400 12px var(--font-body)", color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
          참가 {members.length}명
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px", gap: 18 }}>
        <div style={{ font: "800 26px var(--font-heading)" }}>팀을 선택하세요</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <TeamCard team={1} count={team1Count} loading={joining === 1} onClick={() => pickTeam(1)} />
          <TeamCard team={2} count={team2Count} loading={joining === 2} onClick={() => pickTeam(2)} />
        </div>
        <p style={{ margin: 0, font: "400 12.5px/1.6 var(--font-body)", color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
          같은 팀에 들어간 사람끼리 밴픽을 논의하고, 최다 득표순으로 팀 제안이 만들어집니다.
        </p>
      </div>

      <div style={{ padding: "16px 24px 24px", borderTop: "2px solid var(--color-divider)", display: "flex", gap: 10 }}>
        <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: "flex-start", padding: "14px 16px" }} onClick={copyLink}>
          {copied ? "복사됨" : "링크 복사"}
        </button>
        <button type="button" className="btn btn-secondary" style={{ padding: "14px 16px" }} onClick={() => router.push("/")}>
          나가기
        </button>
      </div>
    </div>
  );
}

function TeamCard({
  team,
  count,
  loading,
  onClick,
}: {
  team: Team;
  count: number;
  loading: boolean;
  onClick: () => void;
}) {
  const color = teamColor(team);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      style={{
        all: "unset",
        boxSizing: "border-box",
        cursor: loading ? "wait" : "pointer",
        border: `2px solid ${color}`,
        background: color,
        color: "#f3f2f2",
        aspectRatio: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 16,
      }}
    >
      <span style={{ font: "800 46px/1 var(--font-heading)" }}>{team}</span>
      <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ font: "800 16px var(--font-heading)" }}>팀 {team}</span>
        <span style={{ font: "400 11.5px var(--font-body)", opacity: 0.85 }}>{count}명 대기 중</span>
      </span>
    </button>
  );
}
