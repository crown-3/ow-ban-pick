// 하드코딩 영웅 목록. 아이콘은 src/app/assets/character-icons/ 의 파일을 정리한 이름으로
// public/heroes/<id>.webp 에 복사해 둔 것을 쓴다 (id가 곧 파일명).

export type HeroRole = "tank" | "damage" | "support";

export interface Hero {
  id: string;
  name: string;
  role: HeroRole;
}

const TANKS: [string, string][] = [
  ["dva", "디바"],
  ["doomfist", "둠피스트"],
  ["junker-queen", "정커퀸"],
  ["mauga", "마우가"],
  ["orisa", "오리사"],
  ["ramattra", "라마트라"],
  ["reinhardt", "라인하르트"],
  ["roadhog", "로드호그"],
  ["sigma", "시그마"],
  ["winston", "윈스턴"],
  ["wrecking-ball", "레킹볼"],
  ["zarya", "자리야"],
  ["hazard", "해저드"],
];

const DAMAGE: [string, string][] = [
  ["ashe", "애쉬"],
  ["bastion", "바스티온"],
  ["cassidy", "캐서디"],
  ["echo", "에코"],
  ["freja", "프레야"],
  ["genji", "겐지"],
  ["hanzo", "한조"],
  ["junkrat", "정크랫"],
  ["mei", "메이"],
  ["pharah", "파라"],
  ["reaper", "리퍼"],
  ["sojourn", "소전"],
  ["soldier-76", "솔저: 76"],
  ["sombra", "솜브라"],
  ["symmetra", "시메트라"],
  ["torbjorn", "토르비욘"],
  ["tracer", "트레이서"],
  ["venture", "벤처"],
  ["widowmaker", "위도우메이커"],
];

const SUPPORT: [string, string][] = [
  ["ana", "아나"],
  ["baptiste", "바티스트"],
  ["brigitte", "브리기테"],
  ["illari", "일리아리"],
  ["juno", "주노"],
  ["kiriko", "키리코"],
  ["lifeweaver", "라이프위버"],
  ["lucio", "루시우"],
  ["mercy", "메르시"],
  ["moira", "모이라"],
  ["wuyang", "우양"],
  ["zenyatta", "젠야타"],
];

function toHeroes(list: [string, string][], role: HeroRole): Hero[] {
  return list.map(([id, name]) => ({ id, name, role }));
}

export const TANK_HEROES = toHeroes(TANKS, "tank");
export const DAMAGE_HEROES = toHeroes(DAMAGE, "damage");
export const SUPPORT_HEROES = toHeroes(SUPPORT, "support");

export const ALL_HEROES: Hero[] = [...TANK_HEROES, ...DAMAGE_HEROES, ...SUPPORT_HEROES];

const HERO_BY_ID = new Map(ALL_HEROES.map((h) => [h.id, h]));

export function getHero(heroId: string): Hero | undefined {
  return HERO_BY_ID.get(heroId);
}

export function heroIconSrc(heroId: string): string {
  return `/heroes/${heroId}.webp`;
}

export const ROLE_LABEL: Record<HeroRole, string> = {
  tank: "탱커",
  damage: "딜러",
  support: "지원가",
};
