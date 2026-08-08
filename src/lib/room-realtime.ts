"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { supabase } from "./supabase/client";
import type { HeroSelectionRow, RoomMemberRow, RoomRow, TeamSubmissionRow } from "./supabase/types";

export interface RoomState {
  loading: boolean;
  error: string | null;
  room: RoomRow | null;
  members: RoomMemberRow[];
  selections: HeroSelectionRow[];
  submissions: TeamSubmissionRow[];
}

type Action =
  | {
      type: "loaded";
      room: RoomRow;
      members: RoomMemberRow[];
      selections: HeroSelectionRow[];
      submissions: TeamSubmissionRow[];
    }
  | { type: "error"; message: string }
  | { type: "member_upsert"; row: RoomMemberRow }
  | { type: "member_delete"; id: string }
  | { type: "selection_upsert"; row: HeroSelectionRow }
  | { type: "selection_delete"; id: string }
  | { type: "submission_upsert"; row: TeamSubmissionRow }
  | { type: "submission_delete"; roomId: string; team: number };

const initialState: RoomState = {
  loading: true,
  error: null,
  room: null,
  members: [],
  selections: [],
  submissions: [],
};

function upsert<T>(list: T[], row: T, match: (item: T) => boolean): T[] {
  const idx = list.findIndex(match);
  if (idx === -1) return [...list, row];
  const next = [...list];
  next[idx] = row;
  return next;
}

function reducer(state: RoomState, action: Action): RoomState {
  switch (action.type) {
    case "loaded":
      return {
        loading: false,
        error: null,
        room: action.room,
        members: action.members,
        selections: action.selections,
        submissions: action.submissions,
      };
    case "error":
      return { ...state, loading: false, error: action.message };
    case "member_upsert":
      return { ...state, members: upsert(state.members, action.row, (m) => m.id === action.row.id) };
    case "member_delete":
      return { ...state, members: state.members.filter((m) => m.id !== action.id) };
    case "selection_upsert":
      return {
        ...state,
        selections: upsert(state.selections, action.row, (s) => s.id === action.row.id),
      };
    case "selection_delete":
      return { ...state, selections: state.selections.filter((s) => s.id !== action.id) };
    case "submission_upsert":
      return {
        ...state,
        submissions: upsert(
          state.submissions,
          action.row,
          (s) => s.room_id === action.row.room_id && s.team === action.row.team
        ),
      };
    case "submission_delete":
      return {
        ...state,
        submissions: state.submissions.filter(
          (s) => !(s.room_id === action.roomId && s.team === action.team)
        ),
      };
  }
}

export interface RoomStore extends RoomState {
  // 낙관적 업데이트용. 서버 왕복을 기다리지 않고 같은 목록에 바로 반영한다 —
  // 행의 id를 클라이언트가 만들어 쓰기 때문에, 나중에 realtime으로 같은 id의 행이
  // 도착하면 upsert가 조용히 덮어써서 별도 정리 로직이 필요 없다.
  applySelectionLocally: (row: HeroSelectionRow) => void;
  removeSelectionLocally: (id: string) => void;
}

// 방 하나당 realtime 채널 하나로 room_members/hero_selections/team_submissions를
// 함께 구독한다. 초기 로드는 REST select, 이후 변경은 Postgres Changes로 반영.
export function useRoomRealtime(roomId: string): RoomStore {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [roomRes, membersRes, selectionsRes, submissionsRes] = await Promise.all([
        supabase.from("rooms").select("*").eq("id", roomId).single(),
        supabase.from("room_members").select("*").eq("room_id", roomId),
        supabase.from("hero_selections").select("*").eq("room_id", roomId),
        supabase.from("team_submissions").select("*").eq("room_id", roomId),
      ]);

      if (cancelled) return;
      if (roomRes.error || !roomRes.data) {
        dispatch({ type: "error", message: "방을 찾을 수 없습니다." });
        return;
      }
      dispatch({
        type: "loaded",
        room: roomRes.data,
        members: membersRes.data ?? [],
        selections: selectionsRes.data ?? [],
        submissions: submissionsRes.data ?? [],
      });
    }

    load();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            dispatch({ type: "member_delete", id: (payload.old as RoomMemberRow).id });
          } else {
            dispatch({ type: "member_upsert", row: payload.new as RoomMemberRow });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hero_selections", filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            dispatch({ type: "selection_delete", id: (payload.old as HeroSelectionRow).id });
          } else {
            dispatch({ type: "selection_upsert", row: payload.new as HeroSelectionRow });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_submissions", filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as TeamSubmissionRow;
            dispatch({ type: "submission_delete", roomId: old.room_id, team: old.team });
          } else {
            dispatch({ type: "submission_upsert", row: payload.new as TeamSubmissionRow });
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const applySelectionLocally = useCallback(
    (row: HeroSelectionRow) => dispatch({ type: "selection_upsert", row }),
    []
  );
  const removeSelectionLocally = useCallback(
    (id: string) => dispatch({ type: "selection_delete", id }),
    []
  );

  return useMemo(
    () => ({ ...state, applySelectionLocally, removeSelectionLocally }),
    [state, applySelectionLocally, removeSelectionLocally]
  );
}
