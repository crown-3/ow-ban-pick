"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { getHero, heroIconSrc, ROLE_LABEL } from "@/lib/heroes";
import { leaveRoom, resetRoom } from "@/lib/room-actions";
import { teamColor } from "@/lib/teams";
import type { RoomMemberRow, Team, TeamSubmissionRow } from "@/lib/supabase/types";

export function RevealScreen({
  me,
  roomId,
  memberId,
  submissions,
}: {
  me: RoomMemberRow;
  roomId: string;
  memberId: string;
  submissions: TeamSubmissionRow[];
}) {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const otherTeam: Team = me.team === 1 ? 2 : 1;

  const mySubmission = submissions.find((s) => s.team === me.team);
  const otherSubmission = submissions.find((s) => s.team === otherTeam);

  async function handleReset() {
    setResetting(true);
    try {
      await resetRoom(roomId);
    } finally {
      setResetting(false);
    }
  }

  async function handleLeave() {
    await leaveRoom(memberId);
    router.push("/");
  }

  return (
    <div className="screen">
      <div
        style={{
          padding: "14px 20px",
          background: "var(--color-accent)",
          borderBottom: "2px solid var(--color-text)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <AppLogo size={32} onAccent />
        <div style={{ font: "800 15px var(--font-heading)", color: "#f3f2f2" }}>밴픽이 공개되었습니다</div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "20px 20px 0" }}>
        {/* 색은 "누가 골랐는지"를 따라간다 — 위는 우리 팀이 고른 밴, 아래는 상대가 고른 밴. */}
        <BanSection
          title={`팀 ${otherTeam}에 대한 밴`}
          subtitle={`팀 ${me.team}이 선택`}
          heroIds={mySubmission?.hero_ids ?? []}
          size="lg"
          color={teamColor(me.team)}
        />
        <div style={{ height: 2, background: "var(--color-divider)", margin: "16px 0 12px" }} />
        <BanSection
          title={`팀 ${me.team}에 대한 밴`}
          subtitle={`팀 ${otherTeam}이 선택`}
          heroIds={otherSubmission?.hero_ids ?? []}
          size="sm"
          color={teamColor(otherTeam)}
        />
      </div>

      <div style={{ padding: "16px 20px 22px", borderTop: "2px solid var(--color-divider)", display: "flex", flexDirection: "column", gap: 10 }}>
        <button type="button" className="btn btn-primary btn-block" style={{ padding: "16px 20px", fontSize: 15 }} disabled={resetting} onClick={handleReset}>
          {resetting ? "초기화하는 중…" : "다시 선택하러 가기"}
        </button>
        <button type="button" className="btn btn-secondary btn-block" style={{ padding: "16px 20px", fontSize: 15 }} onClick={handleLeave}>
          방 나가기
        </button>
      </div>
    </div>
  );
}

function BanSection({
  title,
  subtitle,
  heroIds,
  size,
  color,
}: {
  title: string;
  subtitle: string;
  heroIds: string[];
  size: "lg" | "sm";
  color: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ font: "800 19px var(--font-heading)", display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden style={{ width: 5, height: 19, background: color, flex: "none" }} />
          {title}
        </div>
        <div style={{ font: "600 11.5px var(--font-body)", color }}>{subtitle}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: size === "lg" ? "1fr 1fr" : "repeat(4, 1fr)", gap: size === "lg" ? 12 : 8 }}>
        {heroIds.map((heroId) => {
          const hero = getHero(heroId);
          if (!hero) return null;
          return size === "lg" ? (
            <div key={heroId} style={{ position: "relative", border: `2px solid ${color}`, background: "#fff" }}>
              <span style={{ position: "relative", display: "block", aspectRatio: 1.6, overflow: "hidden" }}>
                <Image src={heroIconSrc(hero.id)} alt="" fill sizes="180px" style={{ objectFit: "cover" }} />
              </span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderTop: `2px solid ${color}` }}>
                <span style={{ font: "800 13px var(--font-heading)" }}>{hero.name}</span>
                <span style={{ font: "600 10px var(--font-body)", color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
                  {ROLE_LABEL[hero.role]}
                </span>
              </div>
            </div>
          ) : (
            <div key={heroId} style={{ border: "1px solid color-mix(in srgb, var(--color-text) 35%, transparent)", background: "#fff" }}>
              <span style={{ position: "relative", display: "block", aspectRatio: 1, overflow: "hidden" }}>
                <Image src={heroIconSrc(hero.id)} alt="" fill sizes="90px" style={{ objectFit: "cover" }} />
              </span>
              <div style={{ font: "600 10px var(--font-body)", textAlign: "center", padding: "4px 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {hero.name}
              </div>
            </div>
          );
        })}
        {heroIds.length === 0 && (
          <div style={{ gridColumn: "1 / -1", font: "400 12px var(--font-body)", color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>
            제출된 밴이 없어요.
          </div>
        )}
      </div>
    </div>
  );
}
