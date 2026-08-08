import type { Team } from "./supabase/types";

// 팀을 가리키는 UI(팀 카드, 팀 라벨, 남은 밴 카운터 등)는 전부 이 색을 쓴다.
// 실제 값은 globals.css의 --color-team-* 토큰.
export function teamColor(team: Team): string {
  return `var(--color-team-${team})`;
}

export function teamColorHover(team: Team): string {
  return `var(--color-team-${team}-600)`;
}

export function teamTagClass(team: Team): string {
  return `tag tag-team-${team}`;
}
