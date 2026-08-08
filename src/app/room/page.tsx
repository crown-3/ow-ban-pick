"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMemberId } from "@/lib/member-id";
import { useRoomRealtime } from "@/lib/room-realtime";
import { PickScreen } from "./_components/PickScreen";
import { RevealScreen } from "./_components/RevealScreen";
import { TeamSelectScreen } from "./_components/TeamSelectScreen";
import { WaitingScreen } from "./_components/WaitingScreen";

// 방 id는 경로(/room/<id>)가 아니라 쿼리(/room?id=<id>)로 받는다.
// 정적 export는 임의의 id를 가진 동적 경로를 만들 수 없기 때문 —
// generateStaticParams로 미리 알 수 있는 방 id가 없다.
export default function RoomPageRoute() {
  return (
    <Suspense fallback={<CenteredMessage text="불러오는 중…" />}>
      <RoomPage />
    </Suspense>
  );
}

function RoomPage() {
  const roomId = useSearchParams().get("id");

  if (!roomId) {
    return <CenteredMessage text="방 주소가 올바르지 않아요. 받은 초대 링크를 다시 확인해 주세요." />;
  }

  return <Room roomId={roomId} />;
}

function Room({ roomId }: { roomId: string }) {
  const state = useRoomRealtime(roomId);
  const memberId = useMemberId(roomId);

  if (state.loading || !memberId) {
    return <CenteredMessage text="불러오는 중…" />;
  }

  if (state.error || !state.room) {
    return <CenteredMessage text="방을 찾을 수 없어요. 링크를 다시 확인해 주세요." />;
  }

  const room = state.room;
  const me = state.members.find((m) => m.id === memberId) ?? null;

  if (!me) {
    return <TeamSelectScreen room={room} members={state.members} roomId={roomId} memberId={memberId} />;
  }

  const bothSubmitted = state.submissions.length === 2;
  if (bothSubmitted) {
    return <RevealScreen me={me} roomId={roomId} memberId={memberId} submissions={state.submissions} />;
  }

  const mySubmission = state.submissions.find((s) => s.team === me.team);
  const otherSubmission = state.submissions.find((s) => s.team !== me.team);
  if (mySubmission) {
    return (
      <WaitingScreen
        room={room}
        me={me}
        roomId={roomId}
        memberId={memberId}
        otherSubmitted={!!otherSubmission}
      />
    );
  }

  return (
    <PickScreen
      room={room}
      me={me}
      selections={state.selections}
      memberId={memberId}
      roomId={roomId}
      applySelectionLocally={state.applySelectionLocally}
      removeSelectionLocally={state.removeSelectionLocally}
    />
  );
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <div className="screen" style={{ alignItems: "center", justifyContent: "center", padding: 24 }}>
      <p style={{ font: "400 14px var(--font-body)", color: "color-mix(in srgb, var(--color-text) 60%, transparent)", textAlign: "center" }}>
        {text}
      </p>
    </div>
  );
}
