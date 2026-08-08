// 팀 제안(득표순 명단) 계산. hero_selections 테이블을 팀 하나 분량으로 필터링해 넘기면,
// 확정 밴(길게 눌러 등록)은 득표수와 무관하게 등록된 순으로 우선 배치하고, 남은 슬롯을
// 득표수 내림차순으로 채운다. 슬롯 수는 방의 ban_count.

export interface SelectionInput {
  hero_id: string;
  locked: boolean;
  created_at: string;
}

export interface ProposalEntry {
  heroId: string;
  votes: number;
  locked: boolean;
}

interface HeroGroup {
  votes: number;
  locked: boolean;
  firstSelectedAt: string;
  firstLockedAt?: string;
}

// 팀이 고른 영웅 전체를 우선순위대로 줄 세운다 (자르지 않음). 앞쪽 ban_count개가
// 실제 제안이고, 그 뒤는 밀려난 후보 — 패널 아래쪽에 따로 보여주기 위해 둘 다 필요하다.
export function rankTeamSelections(selections: SelectionInput[]): ProposalEntry[] {
  const groups = new Map<string, HeroGroup>();

  for (const sel of selections) {
    const existing = groups.get(sel.hero_id);
    if (!existing) {
      groups.set(sel.hero_id, {
        votes: 1,
        locked: sel.locked,
        firstSelectedAt: sel.created_at,
        firstLockedAt: sel.locked ? sel.created_at : undefined,
      });
      continue;
    }
    existing.votes += 1;
    if (sel.created_at < existing.firstSelectedAt) {
      existing.firstSelectedAt = sel.created_at;
    }
    if (sel.locked) {
      existing.locked = true;
      if (!existing.firstLockedAt || sel.created_at < existing.firstLockedAt) {
        existing.firstLockedAt = sel.created_at;
      }
    }
  }

  const entries = Array.from(groups.entries()).map(([heroId, g]) => ({
    heroId,
    votes: g.votes,
    locked: g.locked,
    sortKey: g.locked ? g.firstLockedAt! : g.firstSelectedAt,
  }));

  const locked = entries
    .filter((e) => e.locked)
    .sort((a, b) => compareSortKey(a.sortKey, b.sortKey));

  const unlocked = entries
    .filter((e) => !e.locked)
    .sort((a, b) => b.votes - a.votes || compareSortKey(a.sortKey, b.sortKey));

  return [...locked, ...unlocked].map(({ heroId, votes, locked }) => ({ heroId, votes, locked }));
}

// 실제로 제출되는 상위 ban_count개.
export function computeTeamProposal(
  selections: SelectionInput[],
  banCount: number
): ProposalEntry[] {
  return rankTeamSelections(selections).slice(0, banCount);
}

function compareSortKey(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
