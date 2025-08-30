import { useParams, Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { useCardGame } from "../../../hook/useCardGames";
import { useVersionList, addVersion } from "../../../hook/useVersions";
import LoadingOverlay from "../../../components/common/LoadingOverlay";
import "../CSS/Kaitori.css"; // 同じスタイルを流用（Gridなど）

export default function CardGameDetailPage() {
  const { id } = useParams(); // ← 親の CardGameID
  const { item: game, loading: gameLoading } = useCardGame(id);

  // game?.name が取れたら、その名前で Version を購読
  const { items, loading, err } = useVersionList(game?.name);

  // 追加フォーム
  const [showForm, setShowForm] = useState(false);
  const [versionName, setVersionName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game?.name || !versionName.trim()) return;
    setSubmitting(true);
    setMsg("");
    try {
      const vid = await addVersion(game.name, versionName.trim());
      setVersionName("");
      setShowForm(false);
      setMsg("追加しました");
      // 追加後に詳細へ遷移したい場合は↓
      // navigate(`/admin/kaitori/${id}/version/${vid}`);
    } catch (e: any) {
      setMsg(e?.message ?? "追加に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (gameLoading) return <LoadingOverlay message="読み込み中…" />;
  if (!game) return <div className="page">データが見つかりません。</div>;

  return (
    <div className="kaitori-wrap">
      {loading && <LoadingOverlay message="読み込み中…" />}

      <div className="kaitori-head">
        <div>
          <Link to="/admin/kaitori" style={{ color: "#0b5cff" }}>
            ← 一覧に戻る
          </Link>
          <h1 style={{ marginTop: 6 }}>{game.name}</h1>{" "}
          {/* ← 上にカードゲーム名 */}
        </div>
        <div className="actions">
          <button className="add-btn" onClick={() => setShowForm((v) => !v)}>
            <i className="bx bx-plus" /> 追加
          </button>
        </div>
      </div>

      {showForm && (
        <form className="add-form" onSubmit={onAdd}>
          <label>バージョン名</label>
          <div className="row">
            <input
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="例）第1弾／スターターデッキ など"
            />
            <button type="submit" disabled={submitting}>
              {submitting ? "追加中…" : "保存"}
            </button>
          </div>
          {msg && <p className="msg">{msg}</p>}
        </form>
      )}

      {err && <p className="error">{err}</p>}

      {/* Grid：このカードゲームのバージョン一覧 */}
      {items.length === 0 ? (
        <div className="empty">
          <button className="add-big" onClick={() => setShowForm(true)}>
            <i className="bx bx-plus" /> 追加
          </button>
        </div>
      ) : (
        <div className="grid">
          {items.map((v) => (
            <NavLink
              key={v.id}
              to={`/admin/kaitori/${id}/version/${v.id}`}
              className="grid-card"
            >
              <i className="bx bx-layer"></i>
              <div className="name">{v.versionName}</div>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
