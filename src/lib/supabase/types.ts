// supabase/migrations/0001_init.sql 스키마와 대응하는 최소 타입.
// (supabase gen types로 자동 생성한 게 아니라 수기로 맞춘 것 — 컬럼을 바꾸면 같이 수정할 것.)
//
// 반드시 `interface`가 아니라 `type`으로 선언할 것: @supabase/supabase-js의 제네릭은
// Row/Insert/Update가 `Record<string, unknown>`을 extends하는지로 스키마를 판별하는데,
// TS는 이 조건부 타입 체크에서 interface는 index signature 요건을 만족시키지 못한다고
// 본다 (type alias는 통과). interface로 바꾸면 모든 테이블 제네릭이 조용히 `never`로
// 무너져서 .insert()/.select() 결과 타입이 전부 깨진다.

export type BanCount = 2 | 3 | 4 | 6;
export type Team = 1 | 2;

export type RoomRow = {
  id: string;
  name: string;
  ban_count: BanCount;
  allow_locked_ban: boolean;
  allow_edit_after_submit: boolean;
  created_at: string;
  expires_at: string;
};

export type RoomMemberRow = {
  id: string;
  room_id: string;
  team: Team;
  joined_at: string;
};

export type HeroSelectionRow = {
  id: string;
  room_id: string;
  member_id: string;
  team: Team;
  hero_id: string;
  locked: boolean;
  created_at: string;
};

export type TeamSubmissionRow = {
  room_id: string;
  team: Team;
  hero_ids: string[];
  submitted_at: string;
};

export type Database = {
  public: {
    Tables: {
      rooms: {
        Row: RoomRow;
        Insert: Partial<RoomRow> &
          Pick<RoomRow, "name" | "ban_count" | "allow_locked_ban" | "allow_edit_after_submit">;
        Update: Partial<RoomRow>;
        Relationships: [];
      };
      room_members: {
        Row: RoomMemberRow;
        Insert: RoomMemberRow;
        Update: Partial<RoomMemberRow>;
        Relationships: [];
      };
      hero_selections: {
        Row: HeroSelectionRow;
        Insert: Partial<HeroSelectionRow> &
          Pick<HeroSelectionRow, "room_id" | "member_id" | "team" | "hero_id">;
        Update: Partial<HeroSelectionRow>;
        Relationships: [];
      };
      team_submissions: {
        Row: TeamSubmissionRow;
        Insert: TeamSubmissionRow;
        Update: Partial<TeamSubmissionRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      reset_room: {
        Args: { target_room_id: string };
        Returns: void;
      };
    };
  };
};
