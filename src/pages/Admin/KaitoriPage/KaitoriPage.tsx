import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useCardGameList, addCardGame } from "../../../hook/useCardGames";
import { updateCardGame, deleteCardGame } from "../../../hook/useCardGames";
import LoadingOverlay from "../../../components/common/LoadingOverlay";
import "../CSS/Kaitori.css";

export default function KaitoriPage() {
  const { items, loading, err } = useCardGameList();

  // 新增
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  // 編輯模式
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const navigate = useNavigate();

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setMsg("");
    try {
      const id = await addCardGame(name.trim());
      setName("");
      setShowForm(false);
      setMsg("追加しました");
      // navigate(`/admin/kaitori/${id}`);
    } catch (e: any) {
      setMsg(e?.message ?? "追加に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    try {
      await updateCardGame(editingId, editingName.trim());
      cancelEdit();
    } catch (e: any) {
      console.error("update failed:", e?.code, e?.message, e);
      alert(e?.message ?? "更新に失敗しました");
    }
  };
  const onDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除します。よろしいですか？`)) return;
    await deleteCardGame(id);
  };

  return (
    <div className="kaitori-wrap">
      {loading && <LoadingOverlay message="読み込み中…" />}

      <div className="kaitori-head">
        <h1>カードゲーム</h1>
        <div className="actions">
          {/* 右側：模式切換按鈕 */}
          <button
            className={`mode-btn ${editMode ? "is-on" : ""}`}
            onClick={() => {
              setEditMode((v) => !v);
              cancelEdit();
            }}
            title="新增 / 編輯 模式切換"
          >
            {editMode ? (
              <>
                <i className="bx bx-edit-alt" /> キャンセル
              </>
            ) : (
              <>編集</>
            )}
          </button>

          {/* 只有在「新增模式」時顯示新增表單按鈕 */}
          {!editMode && (
            <button className="add-btn" onClick={() => setShowForm((v) => !v)}>
              追加
            </button>
          )}
        </div>
      </div>

      {/* 新增表單（僅新增模式） */}
      {!editMode && showForm && (
        <form className="add-form" onSubmit={onAdd}>
          <label>カードゲーム名</label>
          <div className="row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例）ポケモンカード"
            />
            <button type="submit" disabled={submitting}>
              {submitting ? "追加中…" : "保存"}
            </button>
          </div>
          {msg && <p className="msg">{msg}</p>}
        </form>
      )}

      {err && <p className="error">{err}</p>}

      {/* Grid */}
      {items.length === 0 ? (
        <div className="empty">
          {!editMode && (
            <button className="add-big" onClick={() => setShowForm(true)}>
              <i className="bx bx-plus" /> 追加
            </button>
          )}
          {editMode && <div className="empty-txt">データがありません</div>}
        </div>
      ) : (
        <div className={`grid ${editMode ? "grid--edit" : ""}`}>
          {items.map((g) => {
            const isEditing = editingId === g.id;
            return (
              <div
                key={g.id}
                className={`grid-card ${isEditing ? "is-editing" : ""}`}
                onClick={() => {
                  if (editMode) return; // 編輯模式下點卡片不跳轉
                  navigate(`/admin/kaitori/${g.id}`);
                }}
              >
                <i className="bx bx-card" />
                {/* 顯示/編輯名稱 */}
                {!isEditing ? (
                  <div className="name">{g.name}</div>
                ) : (
                  <div className="inline-edit">
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <div className="inline-actions">
                      <button className="save" onClick={saveEdit} type="button">
                        保存
                      </button>
                      <button
                        className="cancel"
                        onClick={cancelEdit}
                        type="button"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}

                {/* 編輯模式：浮動的行為鍵 */}
                {editMode && !isEditing && (
                  <div
                    className="card-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="icon-btn"
                      title="編集"
                      onClick={() => startEdit(g.id, g.name)}
                    >
                      <i className="bx bx-pencil"></i>
                    </button>
                    <button
                      className="icon-btn danger"
                      title="削除"
                      onClick={() => onDelete(g.id, g.name)}
                    >
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
