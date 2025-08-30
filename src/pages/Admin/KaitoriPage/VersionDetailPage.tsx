// src/pages/.../VersionDetailPage.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { getVersion } from "../../../hook/useVersions";
import { useKyaraOptions, addKyara } from "../../../hook/useKyaras";
import { useTypeOptions, addType } from "../../../hook/useTypes";
import { addCardInfo } from "../../../hook/useCardInfo";
import { db } from "../../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { uploadImageAndGetURL } from "../../../hook/useUploadImage";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import { useToast } from "../../../components/common/Toast";
import "../CSS/Kaitori.css";

type CardInfo = {
  id: string;
  cardGameName: string;
  versionName: string;
  cardName: string;
  cardPhoto?: string;
  cardKyara?: string;
  cardType?: string;
  storePrice?: number;
  minPrice?: number;
  wantedQty?: number;
};

export default function VersionDetailPage() {
  const { id, vid } = useParams();
  const [versionName, setVersionName] = useState<string>("");
  const [cardGameName, setCardGameName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // ===== 通用 Loading：pending 計數器 =====
  const [pending, setPending] = useState(0);
  const isBusy = pending > 0;
  const runWithLoading = useCallback(async <T,>(fn: () => Promise<T>) => {
    setPending((n) => n + 1);
    try {
      return await fn();
    } finally {
      setPending((n) => Math.max(0, n - 1));
    }
  }, []);

  // 讀取版本資料
  useEffect(() => {
    if (!vid) return;
    runWithLoading(async () => {
      try {
        const v = await getVersion(vid);
        setVersionName(v?.versionName ?? "");
        setCardGameName(v?.cardGameName ?? "");
        setLoading(false);
      } catch {
        toast.error("データ読み込みに失敗しました。");
      }
    });
  }, [vid, runWithLoading, toast]);

  // 下拉選項
  const kyaraOptions = useKyaraOptions(cardGameName, versionName);
  const typeOptions = useTypeOptions(cardGameName, versionName);

  // 新增卡片的彈窗
  const [showForm, setShowForm] = useState(false);

  // 表單狀態
  const [cardName, setCardName] = useState("");
  const [cardKyara, setCardKyara] = useState("");
  const [cardType, setCardType] = useState("");
  const [storePrice, setStorePrice] = useState<number | "">("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [wantedQty, setWantedQty] = useState<number | "">("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  // 新規追加用
  const [addingKyara, setAddingKyara] = useState(false);
  const [addingType, setAddingType] = useState(false);
  const [newKyaraName, setNewKyaraName] = useState("");
  const [newTypeName, setNewTypeName] = useState("");

  // 圖片預覽
  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview("");
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const resetForm = () => {
    setCardName("");
    setCardKyara("");
    setCardType("");
    setStorePrice("");
    setMinPrice("");
    setWantedQty("");
    setPhotoFile(null);
    setPhotoPreview("");
    setAddingKyara(false);
    setAddingType(false);
    setNewKyaraName("");
    setNewTypeName("");
  };

  // 小工具：欄位驗證
  const validateForm = () => {
    if (!cardGameName) {
      toast.error("作品名の読込に失敗しました。ページを更新してください。");
      return false;
    }
    if (!versionName) {
      toast.error("バージョン名の読込に失敗しました。ページを更新してください。");
      return false;
    }
    if (!cardName.trim()) {
      toast.error("カード名を入力してください。");
      return false;
    }
    if (storePrice !== "" && (isNaN(Number(storePrice)) || Number(storePrice) < 0)) {
      toast.error("店頭買取価格は0以上の数値で入力してください。");
      return false;
    }
    if (minPrice !== "" && (isNaN(Number(minPrice)) || Number(minPrice) < 0)) {
      toast.error("最低買取価格は0以上の数値で入力してください。");
      return false;
    }
    if (wantedQty !== "" && (isNaN(Number(wantedQty)) || Number(wantedQty) < 0)) {
      toast.error("募集枚数は0以上の数値で入力してください。");
      return false;
    }
    return true;
  };

  const submitCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    await runWithLoading(async () => {
      try {
        // 1) 上傳圖片（如有）
        let photoDownloadURL: string | undefined;
        if (photoFile) {
          const safeName = cardName
            .trim()
            .replace(/[^\w\-一-龥ぁ-んァ-ン]/g, "_")
            .slice(0, 60);
          const path = `cardImages/${cardGameName}/${versionName}/${safeName}_${Date.now()}.jpg`;
          photoDownloadURL = await uploadImageAndGetURL(photoFile, path);
        }

        // 2) 組 payload：避免 undefined
        const payload = {
          cardGameName,
          versionName,
          cardName: cardName.trim(),
          ...(photoDownloadURL ? { cardPhoto: photoDownloadURL } : {}),
          ...(cardKyara ? { cardKyara } : {}),
          ...(cardType ? { cardType } : {}),
          ...(typeof storePrice === "number" ? { storePrice } : {}),
          ...(typeof minPrice === "number" ? { minPrice } : {}),
          ...(typeof wantedQty === "number" ? { wantedQty } : {}),
        };

        await addCardInfo(payload as any);

        // 先關窗＆清表單，再提示成功（避免被遮住）
        setShowForm(false);
        resetForm();

        toast.success(`「${payload.cardName}」を保存しました。`);
      } catch (err) {
        console.error(err);
        toast.error("保存に失敗しました。もう一度お試しください。");
      }
    });
  };

  // ===== 卡列表：監聽當前版本的卡片（不排序）=====
  const [cards, setCards] = useState<CardInfo[]>([]);
  useEffect(() => {
    if (!cardGameName || !versionName) return;
    const q = query(
      collection(db, "CardInfo_Table"),
      where("cardGameName", "==", cardGameName),
      where("versionName", "==", versionName)
      // 不用 orderBy，前端自己排
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows: CardInfo[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CardInfo, "id">),
      }));
      setCards(rows);
    });
    return () => unsub();
  }, [cardGameName, versionName]);

  // ===== 前端排序：店頭買取価格 高→低；同價比 minPrice 高→低；再比 cardName 升冪 =====
  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => {
      const sa = typeof a.storePrice === "number" ? a.storePrice : -Infinity;
      const sb = typeof b.storePrice === "number" ? b.storePrice : -Infinity;
      if (sb !== sa) return sb - sa;

      const ma = typeof a.minPrice === "number" ? a.minPrice : -Infinity;
      const mb = typeof b.minPrice === "number" ? b.minPrice : -Infinity;
      if (mb !== ma) return mb - ma;

      return (a.cardName || "").localeCompare(b.cardName || "", "ja");
    });
  }, [cards]);

  if (loading) {
    return (
      <div
        className="page"
        style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <Link to={`/admin/kaitori/${id}`} style={{ color: "#0b5cff" }}>
          ← バージョン一覧へ戻る
        </Link>

        <h1 style={{ marginTop: 8 }}>{versionName}</h1>

        <div className="page-actions">
          <button className="add-btn" onClick={() => setShowForm(true)}>
            追加
          </button>
        </div>
      </div>

      {/* 卡片清單 */}
      <div className="cards-grid">
        {sortedCards.map((c) => (
          <Link
            key={c.id}
            to={`/admin/kaitori/${id}/version/${vid}/card/${c.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
            className="card-item"
          >
            <div className="card-thumb">
              {c.cardPhoto ? (
                <img src={c.cardPhoto} alt={c.cardName} />
              ) : (
                <div className="card-thumb__empty">No Image</div>
              )}
            </div>

            <div className="card-name" title={c.cardName}>
              {c.cardName}
            </div>

            <div className="price-block">
              <div className="price-row red">
                店頭買取価格
                <div className="yen">
                  {typeof c.storePrice === "number"
                    ? `¥${c.storePrice.toLocaleString()}`
                    : "—"}
                </div>
              </div>
              <div className="price-row green">
                最低買取価格
                <div className="yen">
                  {typeof c.minPrice === "number"
                    ? `¥${c.minPrice.toLocaleString()}`
                    : "—"}
                </div>
              </div>
              <div className="wanted">
                本日{typeof c.wantedQty === "number" ? c.wantedQty : 0}枚募集
              </div>
            </div>
          </Link>
        ))}
        {sortedCards.length === 0 && (
          <div className="empty-hint">カードはまだ登録されていません</div>
        )}
      </div>

      {/* 80% x 80% 的彈窗 */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-80" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-title">カード追加</div>
                <div className="modal-sub">
                  {cardGameName} / {versionName}
                </div>
              </div>
              <button className="close-btn" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>

            <form className="card-form" onSubmit={submitCard}>
              {/* 左 30%：圖片 */}
              <div className="card-form-left">
                <div className="imgbox">
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" />
                  ) : (
                    <div className="img-empty">画像プレビュー</div>
                  )}
                </div>
                <label className="file-btn">
                  画像を選択
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                    hidden
                  />
                </label>
              </div>

              {/* 右 70%：欄位 */}
              <div className="card-form-right">
                <div className="form-row">
                  <label>カード名</label>
                  <input
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="例）ピカチュウ"
                  />
                </div>

                {/* キャラクター（下拉 + 新規追加） */}
                <div className="form-row">
                  <label>キャラクター</label>

                  {!addingKyara ? (
                    <div className="row-inline">
                      <select
                        value={cardKyara}
                        onChange={(e) => setCardKyara(e.target.value)}
                      >
                        <option value="">（未選択）</option>
                        {kyaraOptions.map((k) => (
                          <option key={k.id} value={k.cardKyaraName}>
                            {k.cardKyaraName}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="mini-btn"
                        onClick={() => setAddingKyara(true)}
                      >
                        ＋ 新規追加
                      </button>
                    </div>
                  ) : (
                    <div className="row-inline">
                      <input
                        value={newKyaraName}
                        onChange={(e) => setNewKyaraName(e.target.value)}
                        placeholder="キャラクター名を入力"
                      />
                      <button
                        type="button"
                        className="mini-btn primary"
                        onClick={async () => {
                          if (!newKyaraName.trim()) {
                            toast.error("キャラクター名を入力してください。");
                            return;
                          }
                          if (!cardGameName || !versionName) {
                            toast.error("バージョン情報の読み込み待ちです。");
                            return;
                          }
                          await runWithLoading(() =>
                            addKyara(cardGameName, versionName, newKyaraName.trim())
                          );
                          toast.success("キャラクターを追加しました。");
                          setCardKyara(newKyaraName.trim());
                          setNewKyaraName("");
                          setAddingKyara(false);
                        }}
                      >
                        追加
                      </button>
                      <button
                        type="button"
                        className="mini-btn"
                        onClick={() => {
                          setAddingKyara(false);
                          setNewKyaraName("");
                        }}
                      >
                        キャンセル
                      </button>
                    </div>
                  )}
                </div>

                {/* 種類（下拉 + 新規追加） */}
                <div className="form-row">
                  <label>種類</label>

                  {!addingType ? (
                    <div className="row-inline">
                      <select
                        value={cardType}
                        onChange={(e) => setCardType(e.target.value)}
                      >
                        <option value="">（未選択）</option>
                        {typeOptions.map((t) => (
                          <option key={t.id} value={t.cardTypeName}>
                            {t.cardTypeName}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="mini-btn"
                        onClick={() => setAddingType(true)}
                      >
                        ＋ 新規追加
                      </button>
                    </div>
                  ) : (
                    <div className="row-inline">
                      <input
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        placeholder="種類名を入力"
                      />
                      <button
                        type="button"
                        className="mini-btn primary"
                        onClick={async () => {
                          if (!newTypeName.trim()) {
                            toast.error("種類名を入力してください。");
                            return;
                          }
                          if (!cardGameName || !versionName) {
                            toast.error("バージョン情報の読み込み待ちです。");
                            return;
                          }
                          await runWithLoading(() =>
                            addType(cardGameName, versionName, newTypeName.trim())
                          );
                          toast.success("種類を追加しました。");
                          setCardType(newTypeName.trim());
                          setNewTypeName("");
                          setAddingType(false);
                        }}
                      >
                        追加
                      </button>
                      <button
                        type="button"
                        className="mini-btn"
                        onClick={() => {
                          setAddingType(false);
                          setNewTypeName("");
                        }}
                      >
                        キャンセル
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <label>店頭買取価格</label>
                  <input
                    type="number"
                    value={storePrice}
                    onChange={(e) =>
                      setStorePrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    min={0}
                  />
                </div>

                <div className="form-row">
                  <label>最低買取価格</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) =>
                      setMinPrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    min={0}
                  />
                </div>

                <div className="form-row">
                  <label>募集枚数</label>
                  <input
                    type="number"
                    value={wantedQty}
                    onChange={(e) =>
                      setWantedQty(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    min={0}
                  />
                </div>

                <div className="form-actions">
                  <button className="primary" type="submit">
                    保存
                  </button>
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 全畫面 Loading */}
      {isBusy && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            backdropFilter: "blur(2px)",
          }}
        >
          <div style={{ display: "grid", placeItems: "center", gap: 12 }}>
            <LoadingSpinner />
            <div
              style={{
                color: "#fff",
                fontWeight: 700,
                textShadow: "0 1px 2px rgba(0,0,0,.4)",
              }}
            >
              処理中…
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
