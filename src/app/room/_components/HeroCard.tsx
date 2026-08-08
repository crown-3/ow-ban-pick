"use client";

import Image from "next/image";
import { heroIconSrc, type Hero } from "@/lib/heroes";
import { useLongPress } from "@/lib/use-long-press";

export function HeroCard({
  hero,
  picked,
  locked,
  canLock,
  onTap,
  onLongPress,
}: {
  hero: Hero;
  picked: boolean;
  locked: boolean;
  canLock: boolean;
  onTap: () => void;
  onLongPress: () => void;
}) {
  const longPress = useLongPress(onTap, canLock ? onLongPress : onTap);

  return (
    <button
      type="button"
      className={`hero-cell${picked ? " is-picked" : ""}${locked ? " is-locked" : ""}`}
      aria-pressed={picked}
      aria-label={`${hero.name}${locked ? " (확정 밴)" : picked ? " (선택됨)" : ""}`}
      {...longPress}
    >
      <span className="hero-portrait">
        <Image
          src={heroIconSrc(hero.id)}
          alt=""
          fill
          sizes="96px"
          className="hero-img"
          draggable={false}
        />
        {locked && <span className="hero-lock-tag">확정</span>}
        {picked && !locked && <span className="hero-pick-tag">✓</span>}
      </span>
      <span className="hero-name">{hero.name}</span>
    </button>
  );
}
