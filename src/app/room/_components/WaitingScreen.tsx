"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { cancelSubmission, leaveRoom } from "@/lib/room-actions";
import { teamColor, teamTagClass } from "@/lib/teams";
import type { RoomMemberRow, RoomRow, Team } from "@/lib/supabase/types";

export function WaitingScreen({
  room,
  me,
  roomId,
  memberId,
  otherSubmitted,
}: {
  room: RoomRow;
  me: RoomMemberRow;
  roomId: string;
  memberId: string;
  otherSubmitted: boolean;
}) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const otherTeam: Team = me.team === 1 ? 2 : 1;

  async function handleCancel() {
    setCancelling(true);
    try {
      await cancelSubmission(roomId, me.team);
    } finally {
      setCancelling(false);
    }
  }

  async function handleLeave() {
    await leaveRoom(memberId);
    router.push("/");
  }

  return (
    <div className="screen">
      <div className="app-header">
        <AppLogo size={52} />
        <div className="app-title">오버워치 친선전 밴픽 공유</div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", padding: "0 28px", gap: 20 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 14, height: 14, background: teamColor(me.team) }} />
          <div style={{ width: 14, height: 14, background: teamColor(me.team), opacity: 0.5 }} />
          <div style={{ width: 14, height: 14, background: teamColor(me.team), opacity: 0.2 }} />
        </div>
        <div style={{ font: "800 30px/1.2 var(--font-heading)" }}>
          상대 팀을
          <br />
          대기 중입니다
        </div>
        <p style={{ margin: 0, font: "400 13.5px/1.7 var(--font-body)", color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }}>
          우리 팀 밴 {room.ban_count}개는 제출됐어요. 상대 팀이 제출하면 서로의 밴픽이 동시에
          공개됩니다.
        </p>
        <div style={{ width: "100%", borderTop: "2px solid var(--color-divider)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ font: "600 13.5px var(--font-body)", color: teamColor(me.team) }}>
              팀 {me.team} (우리)
            </span>
            <span className={teamTagClass(me.team)}>제출 완료</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ font: "600 13.5px var(--font-body)", color: teamColor(otherTeam) }}>
              팀 {otherTeam}
            </span>
            {otherSubmitted ? (
              <span className={teamTagClass(otherTeam)}>제출 완료</span>
            ) : (
              <span
                className="tag"
                style={{
                  border: `1px solid ${teamColor(otherTeam)}`,
                  color: teamColor(otherTeam),
                }}
              >
                선택 중…
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 24px 24px", borderTop: "2px solid var(--color-divider)", display: "flex", gap: 10 }}>
        {room.allow_edit_after_submit && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1, justifyContent: "flex-start", padding: "14px 16px" }}
            disabled={cancelling}
            onClick={handleCancel}
          >
            {cancelling ? "취소하는 중…" : "제출 취소"}
          </button>
        )}
        <button type="button" className="btn btn-secondary" style={{ padding: "14px 16px", flex: room.allow_edit_after_submit ? undefined : 1, justifyContent: "flex-start" }} onClick={handleLeave}>
          나가기
        </button>
      </div>
    </div>
  );
}
