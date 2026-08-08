"use client";

import Image from "next/image";
import { getHero, heroIconSrc, ROLE_LABEL } from "@/lib/heroes";
import type { ProposalEntry } from "@/lib/team-proposal";

export function TeamProposalPanel({
  entries,
  overflow,
  banCount,
}: {
  entries: ProposalEntry[];
  overflow: ProposalEntry[];
  banCount: number;
}) {
  const emptySlots = Math.max(0, banCount - entries.length);

  return (
    <aside className="proposal-panel">
      <div className="proposal-head">
        <div style={{ font: "800 12.5px var(--font-heading)" }}>팀 제안</div>
        <div
          style={{
            font: "400 9.5px var(--font-body)",
            color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
          }}
        >
          최다 득표순
        </div>
      </div>

      <div className="proposal-scroll">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {entries.map((entry) => {
            const hero = getHero(entry.heroId);
            if (!hero) return null;
            return (
              <div
                key={entry.heroId}
                style={{
                  position: "relative",
                  background: "#fff",
                  border: "1px solid color-mix(in srgb, var(--color-text) 25%, transparent)",
                  outline: entry.locked
                    ? "3px solid var(--team-accent, var(--color-accent))"
                    : undefined,
                  outlineOffset: entry.locked ? -3 : undefined,
                }}
              >
                <span
                  style={{ position: "relative", display: "block", aspectRatio: 1, overflow: "hidden" }}
                >
                  <Image src={heroIconSrc(hero.id)} alt="" fill sizes="84px" style={{ objectFit: "cover" }} />
                </span>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "3px 5px 4px",
                    font: "600 9px var(--font-body)",
                  }}
                >
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {hero.name}
                  </span>
                  <span style={{ color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
                    {ROLE_LABEL[hero.role]}
                  </span>
                </div>
                {entry.locked && <div className="hero-lock-tag">확정</div>}
                {!entry.locked && entry.votes > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      background: "var(--color-text)",
                      color: "#f3f2f2",
                      font: "800 9px var(--font-heading)",
                      padding: "2px 5px",
                    }}
                  >
                    {entry.votes}
                  </div>
                )}
              </div>
            );
          })}

          {Array.from({ length: emptySlots }).map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{
                border: "1px dashed color-mix(in srgb, var(--color-text) 35%, transparent)",
                aspectRatio: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                font: "600 9.5px var(--font-body)",
                color: "color-mix(in srgb, var(--color-text) 40%, transparent)",
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              빈 칸
              <br />
              {entries.length + i + 1}
            </div>
          ))}
        </div>

        {/* 밴 개수를 넘겨 밀려난 후보들. 표가 갈리면 언제든 위로 올라올 수 있으니
            안 보이게 잘라내지 않고 2열 격자로 깔아둔다. */}
        {overflow.length > 0 && (
          <div className="proposal-overflow">
            <div className="proposal-overflow-label">대기 {overflow.length}</div>
            <div className="proposal-overflow-grid">
              {overflow.map((entry) => {
                const hero = getHero(entry.heroId);
                if (!hero) return null;
                return (
                  <div key={entry.heroId} className="proposal-overflow-cell" title={hero.name}>
                    <span
                      style={{
                        position: "relative",
                        display: "block",
                        aspectRatio: 1,
                        overflow: "hidden",
                      }}
                    >
                      <Image src={heroIconSrc(hero.id)} alt="" fill sizes="44px" style={{ objectFit: "cover" }} />
                    </span>
                    <span className="proposal-overflow-name">{hero.name}</span>
                    {entry.votes > 0 && (
                      <span className="proposal-overflow-votes">{entry.votes}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
