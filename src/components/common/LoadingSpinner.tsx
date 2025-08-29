import type { CSSProperties } from "react";
import "./loading.css";

type Props = {
  size?: number;          // 直徑 px
  thickness?: number;     // 線寬 px
  label?: string;         // アクセシビリティ用ラベル
  style?: CSSProperties;
  className?: string;
};

export default function LoadingSpinner({
  size = 28,
  thickness = 3,
  label = "読み込み中…",
  style,
  className,
}: Props) {
  const border = `${thickness}px`;
  return (
    <span
      className={`mc-spinner ${className ?? ""}`}
      role="status"
      aria-live="polite"
      aria-label={label}
      style={
        {
          "--mc-size": `${size}px`,
          "--mc-border": border,
          ...style,
        } as CSSProperties
      }
    >
      <span className="mc-visually-hidden">{label}</span>
    </span>
  );
}
