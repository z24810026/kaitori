import "./loading.css";
import LoadingSpinner from "./LoadingSpinner";

type Props = {
  message?: string;     // 例：「読み込み中…」
  dimOpacity?: number;  // 背景の暗さ（0~1）
};

export default function LoadingOverlay({ message = "読み込み中…", dimOpacity = 0.35 }: Props) {
  return (
    <div className="mc-overlay" style={{ background: `rgba(0,0,0,${dimOpacity})` }}>
      <div className="mc-overlay__content">
        <LoadingSpinner size={36} thickness={4} />
        <div className="mc-overlay__text">{message}</div>
      </div>
    </div>
  );
}
