import Image from "next/image";

// src/app/assets/ow_icon.webp 를 public/ow-icon.webp 로 복사해 쓴다.
export function AppLogo({ size = 52, onAccent = false }: { size?: number; onAccent?: boolean }) {
  return (
    <Image
      src="/ow-icon.webp"
      alt="오버워치"
      width={size}
      height={size}
      priority
      style={{
        flex: "none",
        width: size,
        height: "auto",
        // 진한 컬러 배경 위에서는 로고의 짙은 회색이 묻히므로 흰색으로 눕힌다.
        filter: onAccent ? "brightness(0) invert(1)" : undefined,
      }}
    />
  );
}
