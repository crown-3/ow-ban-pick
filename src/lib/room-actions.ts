"use client";

// room-realtime.ts가 읽기/구독을 맡는 것과 대칭으로, 여기는 방 상태를 바꾸는
// 쓰기 동작만 모아둔다. UI는 이 함수들을 조합해서 쓴다.

import { supabase } from "./supabase/client";
import type { BanCount, HeroSelectionRow, Team } from "./supabase/types";

export async function createRoom(params: {
  name: string;
  banCount: BanCount;
  allowLockedBan: boolean;
  allowEditAfterSubmit: boolean;
}) {
  const { data, error } = await supabase
    .from("rooms")
    .insert({
      name: params.name,
      ban_count: params.banCount,
      allow_locked_ban: params.allowLockedBan,
      allow_edit_after_submit: params.allowEditAfterSubmit,
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error("방 생성에 실패했습니다.");
  return data;
}

export async function joinTeam(roomId: string, memberId: string, team: Team) {
  const { error } = await supabase
    .from("room_members")
    .upsert({ id: memberId, room_id: roomId, team, joined_at: new Date().toISOString() });
  if (error) throw error;
}

export async function leaveRoom(memberId: string) {
  const { error } = await supabase.from("room_members").delete().eq("id", memberId);
  if (error) throw error;
}

// id/created_at까지 클라이언트가 정해서 보낸다. 그래야 화면에 먼저 그려둔 낙관적 행과
// 나중에 realtime으로 돌아오는 행이 같은 id를 가져 자연스럽게 하나로 합쳐진다.
export async function addHeroSelection(row: HeroSelectionRow) {
  const { error } = await supabase.from("hero_selections").insert(row);
  if (error) throw error;
}

export async function removeHeroSelection(memberId: string, heroId: string) {
  const { error } = await supabase
    .from("hero_selections")
    .delete()
    .eq("member_id", memberId)
    .eq("hero_id", heroId);
  if (error) throw error;
}

export async function setHeroSelectionLocked(memberId: string, heroId: string, locked: boolean) {
  const { error } = await supabase
    .from("hero_selections")
    .update({ locked })
    .eq("member_id", memberId)
    .eq("hero_id", heroId);
  if (error) throw error;
}

export async function submitTeam(roomId: string, team: Team, heroIds: string[]) {
  const { error } = await supabase
    .from("team_submissions")
    .upsert({ room_id: roomId, team, hero_ids: heroIds, submitted_at: new Date().toISOString() });
  if (error) throw error;
}

export async function cancelSubmission(roomId: string, team: Team) {
  const { error } = await supabase
    .from("team_submissions")
    .delete()
    .eq("room_id", roomId)
    .eq("team", team);
  if (error) throw error;
}

export async function resetRoom(roomId: string) {
  const { error } = await supabase.rpc("reset_room", { target_room_id: roomId });
  if (error) throw error;
}
