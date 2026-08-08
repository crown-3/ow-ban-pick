import { describe, expect, it } from "vitest";
import { computeTeamProposal, rankTeamSelections, type SelectionInput } from "./team-proposal";

function sel(heroId: string, createdAt: string, locked = false): SelectionInput {
  return { hero_id: heroId, locked, created_at: createdAt };
}

describe("computeTeamProposal", () => {
  it("returns an empty list when there are no selections", () => {
    expect(computeTeamProposal([], 4)).toEqual([]);
  });

  it("ranks unlocked heroes by vote count, most votes first", () => {
    const selections = [
      sel("zarya", "2024-01-01T00:00:00Z"),
      sel("zarya", "2024-01-01T00:00:01Z"),
      sel("widowmaker", "2024-01-01T00:00:02Z"),
      sel("zarya", "2024-01-01T00:00:03Z"),
      sel("widowmaker", "2024-01-01T00:00:04Z"),
    ];
    const result = computeTeamProposal(selections, 4);
    expect(result).toEqual([
      { heroId: "zarya", votes: 3, locked: false },
      { heroId: "widowmaker", votes: 2, locked: false },
    ]);
  });

  it("breaks vote ties by earliest selection", () => {
    const selections = [
      sel("tracer", "2024-01-01T00:00:05Z"),
      sel("genji", "2024-01-01T00:00:01Z"),
    ];
    const result = computeTeamProposal(selections, 4);
    expect(result.map((e) => e.heroId)).toEqual(["genji", "tracer"]);
  });

  it("puts locked (확정) heroes first regardless of vote count", () => {
    const selections = [
      sel("widowmaker", "2024-01-01T00:00:00Z"),
      sel("widowmaker", "2024-01-01T00:00:01Z"),
      sel("widowmaker", "2024-01-01T00:00:02Z"),
      sel("doomfist", "2024-01-01T00:00:03Z", true),
    ];
    const result = computeTeamProposal(selections, 4);
    expect(result[0]).toEqual({ heroId: "doomfist", votes: 1, locked: true });
    expect(result[1]).toEqual({ heroId: "widowmaker", votes: 3, locked: false });
  });

  it("orders multiple locked heroes by when they were locked", () => {
    const selections = [
      sel("doomfist", "2024-01-01T00:00:05Z", true),
      sel("tracer", "2024-01-01T00:00:01Z", true),
    ];
    const result = computeTeamProposal(selections, 4);
    expect(result.map((e) => e.heroId)).toEqual(["tracer", "doomfist"]);
  });

  it("treats a hero as locked if any single selection row for it is locked", () => {
    const selections = [
      sel("ana", "2024-01-01T00:00:00Z", false),
      sel("ana", "2024-01-01T00:00:01Z", true),
    ];
    const result = computeTeamProposal(selections, 4);
    expect(result).toEqual([{ heroId: "ana", votes: 2, locked: true }]);
  });

  it("truncates to ban_count slots, locked entries taking priority", () => {
    const selections = [
      sel("a", "2024-01-01T00:00:00Z", true),
      sel("b", "2024-01-01T00:00:01Z", true),
      sel("c", "2024-01-01T00:00:02Z", true),
      sel("d", "2024-01-01T00:00:03Z"),
      sel("d", "2024-01-01T00:00:04Z"),
    ];
    const result = computeTeamProposal(selections, 2);
    expect(result.map((e) => e.heroId)).toEqual(["a", "b"]);
  });
});

describe("rankTeamSelections", () => {
  it("keeps the heroes that overflow past ban_count, still in priority order", () => {
    const selections = [
      sel("locked", "2024-01-01T00:00:00Z", true),
      sel("three-votes", "2024-01-01T00:00:01Z"),
      sel("three-votes", "2024-01-01T00:00:02Z"),
      sel("three-votes", "2024-01-01T00:00:03Z"),
      sel("two-votes", "2024-01-01T00:00:04Z"),
      sel("two-votes", "2024-01-01T00:00:05Z"),
      sel("one-vote", "2024-01-01T00:00:06Z"),
    ];
    const ranked = rankTeamSelections(selections);
    expect(ranked.map((e) => e.heroId)).toEqual([
      "locked",
      "three-votes",
      "two-votes",
      "one-vote",
    ]);
    // 밴 2개짜리 방이라면 뒤의 둘이 "밀려난 후보"로 패널 아래에 깔린다.
    expect(ranked.slice(2).map((e) => e.heroId)).toEqual(["two-votes", "one-vote"]);
  });

  it("agrees with computeTeamProposal on the leading entries", () => {
    const selections = [
      sel("x", "2024-01-01T00:00:00Z"),
      sel("x", "2024-01-01T00:00:01Z"),
      sel("y", "2024-01-01T00:00:02Z"),
      sel("z", "2024-01-01T00:00:03Z", true),
    ];
    expect(rankTeamSelections(selections).slice(0, 2)).toEqual(
      computeTeamProposal(selections, 2)
    );
  });
});
