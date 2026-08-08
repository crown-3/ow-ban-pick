"use client";

import Image from "next/image";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  DialogActions,
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogKicker,
  DialogTitle,
} from "@/components/Dialog";
import { AppLogo } from "@/components/AppLogo";
import {
  DAMAGE_HEROES,
  getHero,
  heroIconSrc,
  SUPPORT_HEROES,
  TANK_HEROES,
  type Hero,
} from "@/lib/heroes";
import {
  addHeroSelection,
  joinTeam,
  leaveRoom,
  removeHeroSelection,
  setHeroSelectionLocked,
  submitTeam,
} from "@/lib/room-actions";
import { rankTeamSelections } from "@/lib/team-proposal";
import { teamColor } from "@/lib/teams";
import type { HeroSelectionRow, RoomMemberRow, RoomRow, Team } from "@/lib/supabase/types";
import { HeroCard } from "./HeroCard";
import { TeamProposalPanel } from "./TeamProposalPanel";

// 스크롤이 멈춘 뒤 이 시간 동안은 탭을 무시한다.
const SCROLL_SETTLE_MS = 200;

export function PickScreen({
  room,
  me,
  selections,
  memberId,
  roomId,
  applySelectionLocally,
  removeSelectionLocally,
}: {
  room: RoomRow;
  me: RoomMemberRow;
  selections: HeroSelectionRow[];
  memberId: string;
  roomId: string;
  applySelectionLocally: (row: HeroSelectionRow) => void;
  removeSelectionLocally: (id: string) => void;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const mySelections = useMemo(
    () => new Map(selections.filter((s) => s.member_id === memberId).map((s) => [s.hero_id, s])),
    [selections, memberId]
  );

  const teamSelections = useMemo(
    () => selections.filter((s) => s.team === me.team),
    [selections, me.team]
  );

  // 전체 순위를 한 번 구해서 앞은 제안, 뒤는 밀려난 후보로 나눈다.
  const ranked = useMemo(() => rankTeamSelections(teamSelections), [teamSelections]);
  const proposal = useMemo(() => ranked.slice(0, room.ban_count), [ranked, room.ban_count]);
  const overflow = useMemo(() => ranked.slice(room.ban_count), [ranked, room.ban_count]);

  // 관성 스크롤이 흐르는 중에 손가락을 대면 iOS는 그걸 "스크롤 멈춤"으로 쓰는데,
  // 이동이 거의 없어서 탭으로도 잡힌다. 스크롤 직후 잠깐은 탭을 무시해서 막는다.
  const lastScrollAtRef = useRef(0);
  function scrollSettling() {
    return Date.now() - lastScrollAtRef.current < SCROLL_SETTLE_MS;
  }

  function newRow(heroId: string, locked: boolean): HeroSelectionRow {
    return {
      id: crypto.randomUUID(),
      room_id: roomId,
      member_id: memberId,
      team: me.team,
      hero_id: heroId,
      locked,
      created_at: new Date().toISOString(),
    };
  }

  // 아래 핸들러들은 전부 "화면 먼저, 서버 나중" 순서다. 서버 왕복을 기다리면 탭이
  // 먹통처럼 느껴지기 때문에 로컬 상태를 즉시 바꾸고, 요청이 실패하면 되돌린다.
  async function handleTap(heroId: string) {
    if (scrollSettling()) return;
    const existing = mySelections.get(heroId);
    if (existing) {
      removeSelectionLocally(existing.id);
      try {
        await removeHeroSelection(memberId, heroId);
      } catch {
        applySelectionLocally(existing);
      }
      return;
    }
    const row = newRow(heroId, false);
    applySelectionLocally(row);
    try {
      await addHeroSelection(row);
    } catch {
      removeSelectionLocally(row.id);
    }
  }

  // 길게 누르기는 확정 밴 토글. 이미 확정한 영웅을 다시 길게 누르면 일반 선택으로 내려온다.
  async function handleLongPress(heroId: string) {
    if (scrollSettling()) return;
    const existing = mySelections.get(heroId);
    if (!existing) {
      const row = newRow(heroId, true);
      applySelectionLocally(row);
      try {
        await addHeroSelection(row);
      } catch {
        removeSelectionLocally(row.id);
      }
      return;
    }

    const nextLocked = !existing.locked;
    applySelectionLocally({ ...existing, locked: nextLocked });
    try {
      await setHeroSelectionLocked(memberId, heroId, nextLocked);
    } catch {
      applySelectionLocally(existing);
    }
  }

  async function switchTeam() {
    const other: Team = me.team === 1 ? 2 : 1;
    await joinTeam(roomId, memberId, other);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleLeave() {
    await leaveRoom(memberId);
    router.push("/");
  }

  async function handleConfirmSubmit() {
    setSubmitting(true);
    try {
      await submitTeam(
        roomId,
        me.team,
        proposal.map((entry) => entry.heroId)
      );
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // --team-accent 하나만 여기서 정하면 확정 밴 테두리·태그 같은 팀 소유 UI가 전부 따라온다.
    <div
      className="screen screen-fixed"
      style={{ "--team-accent": teamColor(me.team) } as CSSProperties}
    >
      <div className="app-header-compact">
        <AppLogo size={30} />
        <div className="app-title">오버워치 친선전 밴픽 공유</div>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: "6px 10px", fontSize: 11.5 }}
          onClick={copyLink}
        >
          {copied ? "복사됨" : "링크 복사"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: "6px 10px", fontSize: 11.5 }}
          onClick={handleLeave}
        >
          나가기
        </button>
      </div>

      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "2px solid var(--color-divider)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ font: "800 17px var(--font-heading)", display: "flex", alignItems: "center", gap: 7 }}>
            <span
              aria-hidden
              style={{ width: 5, height: 17, background: teamColor(me.team), flex: "none" }}
            />
            <span>
              <span style={{ color: teamColor(me.team) }}>팀 {me.team}</span> 밴픽 선택
            </span>
          </div>
          <div
            style={{
              font: "400 11px var(--font-body)",
              color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
            }}
          >
            상대에게 걸 밴을 고르세요
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ font: "800 15px var(--font-heading)", color: teamColor(me.team) }}>
            {proposal.length}
            <span style={{ color: "color-mix(in srgb, var(--color-text) 40%, transparent)" }}>
              {" "}
              / {room.ban_count}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: "7px 10px", fontSize: 11.5 }}
            onClick={switchTeam}
          >
            팀 전환
          </button>
        </div>
      </div>

      <div className="pick-body">
        <div
          className="pick-palette"
          onScroll={() => {
            lastScrollAtRef.current = Date.now();
          }}
        >
          <RoleSection
            title="탱커"
            heroes={TANK_HEROES}
            mySelections={mySelections}
            canLock={room.allow_locked_ban}
            onTap={handleTap}
            onLongPress={handleLongPress}
          />
          <RoleSection
            title="딜러"
            heroes={DAMAGE_HEROES}
            mySelections={mySelections}
            canLock={room.allow_locked_ban}
            onTap={handleTap}
            onLongPress={handleLongPress}
          />
          <RoleSection
            title="지원가"
            heroes={SUPPORT_HEROES}
            mySelections={mySelections}
            canLock={room.allow_locked_ban}
            onTap={handleTap}
            onLongPress={handleLongPress}
          />
        </div>
        <TeamProposalPanel entries={proposal} overflow={overflow} banCount={room.ban_count} />
      </div>

      <div
        style={{
          borderTop: "2px solid var(--color-divider)",
          padding: "12px 16px",
          display: "flex",
          gap: 10,
          alignItems: "center",
          background: "#fff",
        }}
      >
        <div
          style={{
            flex: 1,
            font: "400 11px/1.4 var(--font-body)",
            color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
          }}
        >
          {room.allow_locked_ban
            ? "탭해서 선택 · 길게 눌러 확정 밴 (다시 길게 누르면 해제)"
            : "탭해서 밴 후보를 고르세요"}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: "14px 22px", fontSize: 15 }}
          onClick={() => setConfirmOpen(true)}
        >
          제출
        </button>
      </div>

      {confirmOpen && (
        <DialogBackdrop>
          <DialogContent>
            <DialogKicker>제출 확인</DialogKicker>
            <DialogTitle>이 {proposal.length}개로 제출할까요?</DialogTitle>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 8,
                marginBottom: 14,
              }}
            >
              {proposal.map((entry) => {
                const hero = getHero(entry.heroId);
                if (!hero) return null;
                return (
                  <div
                    key={entry.heroId}
                    style={{
                      position: "relative",
                      background: "#fff",
                      border: "1px solid color-mix(in srgb, var(--color-text) 30%, transparent)",
                      outline: entry.locked
                        ? "2px solid var(--team-accent, var(--color-accent))"
                        : undefined,
                      outlineOffset: entry.locked ? -2 : undefined,
                    }}
                  >
                    <span
                      style={{
                        position: "relative",
                        display: "block",
                        aspectRatio: 1,
                        overflow: "hidden",
                      }}
                    >
                      <Image src={heroIconSrc(hero.id)} alt="" fill sizes="72px" style={{ objectFit: "cover" }} />
                    </span>
                    <div
                      style={{
                        font: "600 9.5px var(--font-body)",
                        textAlign: "center",
                        padding: "3px 2px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {hero.name}
                    </div>
                  </div>
                );
              })}
            </div>
            <DialogBody>
              제출하면 상대 팀이 제출할 때까지 대기 화면으로 넘어갑니다. 상대가 이미 제출했다면 바로
              결과가 열립니다.
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>
              다시 볼게요
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={submitting}
              onClick={handleConfirmSubmit}
            >
              {submitting ? "제출 중…" : "제출"}
            </button>
          </DialogActions>
        </DialogBackdrop>
      )}
    </div>
  );
}

function RoleSection({
  title,
  heroes,
  mySelections,
  canLock,
  onTap,
  onLongPress,
}: {
  title: string;
  heroes: Hero[];
  mySelections: Map<string, HeroSelectionRow>;
  canLock: boolean;
  onTap: (heroId: string) => void;
  onLongPress: (heroId: string) => void;
}) {
  const pickedCount = heroes.filter((h) => mySelections.has(h.id)).length;

  return (
    <div>
      <div style={{ padding: "10px 12px 4px", display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ font: "800 13px var(--font-heading)" }}>{title}</span>
        <span
          style={{
            font: "400 10.5px var(--font-body)",
            color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
          }}
        >
          {pickedCount > 0 ? `${pickedCount} 선택` : `${heroes.length}종`}
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 6,
          padding: "4px 12px 14px",
        }}
      >
        {heroes.map((hero) => {
          const selection = mySelections.get(hero.id);
          return (
            <HeroCard
              key={hero.id}
              hero={hero}
              picked={!!selection}
              locked={!!selection?.locked}
              canLock={canLock}
              onTap={() => onTap(hero.id)}
              onLongPress={() => onLongPress(hero.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
