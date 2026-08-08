-- 오버워치 친선전 밴픽 공유 앱 — 초기 스키마
--
-- 이 앱은 로그인이 없다. 방 링크(uuid, 추측 불가)를 아는 것 자체가 접근 권한이라는
-- 모델이라, RLS는 anon role에 대해 전면 허용으로 열어둔다. 민감 정보(개인정보, 결제 등)를
-- 다루지 않는 캐주얼 도구이기 때문에 감수하는 트레이드오프다.

create extension if not exists pgcrypto;

-- ── rooms ────────────────────────────────────────────────────────────────
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null default '내전',
  ban_count smallint not null default 4 check (ban_count in (2, 3, 4, 6)),
  allow_locked_ban boolean not null default true,
  allow_edit_after_submit boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);

-- ── room_members ─────────────────────────────────────────────────────────
-- id는 클라이언트가 생성해 localStorage에 저장하는 익명 멤버 id.
-- (member 하나 = 브라우저 하나. 로그인이 없으므로 서버가 발급하지 않는다.)
create table if not exists room_members (
  id uuid primary key,
  room_id uuid not null references rooms (id) on delete cascade,
  team smallint not null check (team in (1, 2)),
  joined_at timestamptz not null default now()
);
create index if not exists room_members_room_id_idx on room_members (room_id);

-- ── hero_selections ──────────────────────────────────────────────────────
-- 멤버 한 명이 "이 영웅을 밴 후보로 올린다"고 표시한 것. 팀 제안(득표순 명단)은
-- 이 테이블을 팀별로 집계해 클라이언트에서 계산한다 (lib/team-proposal.ts).
create table if not exists hero_selections (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms (id) on delete cascade,
  member_id uuid not null references room_members (id) on delete cascade,
  team smallint not null check (team in (1, 2)),
  hero_id text not null,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  unique (member_id, hero_id)
);
create index if not exists hero_selections_room_id_idx on hero_selections (room_id);

-- ── team_submissions ─────────────────────────────────────────────────────
-- 팀이 "이걸로 최종 제출" 누른 결과. 두 팀 모두 존재해야 결과가 공개된다.
create table if not exists team_submissions (
  room_id uuid not null references rooms (id) on delete cascade,
  team smallint not null check (team in (1, 2)),
  hero_ids jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now(),
  primary key (room_id, team)
);

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table rooms enable row level security;
alter table room_members enable row level security;
alter table hero_selections enable row level security;
alter table team_submissions enable row level security;

create policy "anon full access" on rooms for all to anon using (true) with check (true);
create policy "anon full access" on room_members for all to anon using (true) with check (true);
create policy "anon full access" on hero_selections for all to anon using (true) with check (true);
create policy "anon full access" on team_submissions for all to anon using (true) with check (true);

-- ── Realtime ─────────────────────────────────────────────────────────────
-- Postgres Changes로 방 상태를 구독하기 위해 supabase_realtime publication에 추가.
alter publication supabase_realtime add table room_members;
alter publication supabase_realtime add table hero_selections;
alter publication supabase_realtime add table team_submissions;

-- ── reset_room RPC ───────────────────────────────────────────────────────
-- "다시 선택하러 가기": 방/멤버는 유지하고 선택·제출만 한 번에 지운다.
-- 두 팀이 동시에 눌러도(레이스) 결과가 같도록 트랜잭션 하나로 처리.
create or replace function reset_room(target_room_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from team_submissions where room_id = target_room_id;
  delete from hero_selections where room_id = target_room_id;
$$;

grant execute on function reset_room(uuid) to anon;

-- ── 만료 방 자동 삭제 (pg_cron) ──────────────────────────────────────────
-- Supabase 대시보드에서 Database > Extensions > pg_cron 활성화가 되어 있어야
-- 아래 스케줄이 등록된다 (일부 플랜/리전은 대시보드에서 켜야 SQL만으로 부족할 수 있음).
create extension if not exists pg_cron;

select cron.schedule(
  'delete-expired-rooms',
  '0 * * * *', -- 매시 정각
  $$ delete from rooms where expires_at < now(); $$
);
