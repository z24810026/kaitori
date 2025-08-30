import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { uploadImageAndGetURL } from "../../../hook/useUploadImage";
import { useKyaraOptions, addKyara } from "../../../hook/useKyaras";
import { useTypeOptions, addType } from "../../../hook/useTypes";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import { useToast } from "../../../components/common/Toast";

type CardDoc = {
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

export default function CardDetailPage() {
  const { id, vid, cid } = useParams(); // id: CardGameID, vid: VersionID, cid: CardID
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(0);
  const isBusy = pending > 0;
  const runWithLoading = useCallback(async <T,>(fn: () => Promise<T>) => {
    setPending((n) => n + 1);
    try { return await fn(); } finally { setPending((n) => Math.max(0, n - 1)); }
  }, []);

  // 原始資料
  const [orig, setOrig] = useState<CardDoc | null>(null);

  // 可編輯狀態
  const [cardName, setCardName] = useState("");
  const [cardKyara, setCardKyara] = useState("");
  const [cardType, setCardType] = useState("");
  const [storePrice, setStorePrice] = useState<number | "">("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [wantedQty, setWantedQty] = useState<number | "">("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  // 新規追加（下拉）
  const [addingKyara, setAddingKyara] = useState(false);
  const [addingType, setAddingType] = useState(false);
  const [newKyaraName, setNewKyaraName] = useState("");
  const [newTypeName, setNewTypeName] = useState("");

  // 讀取卡片
  useEffect(() => {
    if (!cid) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "CardInfo_Table", cid));
        if (!snap.exists()) {
          toast.error("カードが見つかりません。");
          navigate(`/admin/kaitori/${id}/version/${vid}`);
          return;
        }
        const d = snap.data() as CardDoc;
        setOrig(d);

        setCardName(d.cardName ?? "");
        setCardKyara(d.cardKyara ?? "");
        setCardType(d.cardType ?? "");
        setStorePrice(typeof d.storePrice === "number" ? d.storePrice : "");
        setMinPrice(typeof d.minPrice === "number" ? d.minPrice : "");
        setWantedQty(typeof d.wantedQty === "number" ? d.wantedQty : "");
        setPhotoPreview(d.cardPhoto ?? "");

        setLoading(false);
      } catch (e) {
        console.error(e);
        toast.error("詳細の取得に失敗しました。");
        navigate(`/admin/kaitori/${id}/version/${vid}`);
      }
    })();
  }, [cid, id, vid, navigate, toast]);

  const cardGameName = orig?.cardGameName ?? "";
  const versionName  = orig?.versionName  ?? "";

  const kyaraOptions = useKyaraOptions(cardGameName, versionName);
  const typeOptions  = useTypeOptions(cardGameName, versionName);

  // 換圖預覽
  useEffect(() => {
    if (!photoFile) return;
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const changed = useMemo(() => {
    if (!orig) return false;
    return (
      orig.cardName !== cardName ||
      (orig.cardKyara ?? "") !== (cardKyara ?? "") ||
      (orig.cardType ?? "")  !== (cardType ?? "") ||
      (orig.storePrice ?? "") !== (storePrice === "" ? "" : storePrice) ||
      (orig.minPrice ?? "")   !== (minPrice === "" ? "" : minPrice) ||
      (orig.wantedQty ?? "")  !== (wantedQty === "" ? "" : wantedQty) ||
      !!photoFile
    );
  }, [orig, cardName, cardKyara, cardType, storePrice, minPrice, wantedQty, photoFile]);

  const validate = () => {
    if (!orig) return false;
    if (!cardName.trim()) { toast.error("カード名を入力してください。"); return false; }
    if (storePrice !== "" && (isNaN(Number(storePrice)) || Number(storePrice) < 0)) {
      toast.error("店頭買取価格は0以上の数値で入力してください。"); return false;
    }
    if (minPrice !== "" && (isNaN(Number(minPrice)) || Number(minPrice) < 0)) {
      toast.error("最低買取価格は0以上の数値で入力してください。"); return false;
    }
    if (wantedQty !== "" && (isNaN(Number(wantedQty)) || Number(wantedQty) < 0)) {
      toast.error("募集枚数は0以上の数値で入力してください。"); return false;
    }
    return true;
  };

  const save = async () => {
    if (!cid || !orig) return;
    if (!validate()) return;

    await runWithLoading(async () => {
      try {
        let photoDownloadURL: string | undefined;
        if (photoFile) {
          // 上傳新圖
          const safe = cardName.trim().replace(/[^\w\-一-龥ぁ-んァ-ン]/g, "_").slice(0, 60);
          const path = `cardImages/${orig.cardGameName}/${orig.versionName}/${safe}_${Date.now()}.jpg`;
          photoDownloadURL = await uploadImageAndGetURL(photoFile, path);
        }

        const payload: Partial<CardDoc> = {
          cardName: cardName.trim(),
          cardKyara: cardKyara || undefined,
          cardType:  cardType  || undefined,
          storePrice: typeof storePrice === "number" ? storePrice : undefined,
          minPrice:   typeof minPrice   === "number" ? minPrice   : undefined,
          wantedQty:  typeof wantedQty  === "number" ? wantedQty  : undefined,
          ...(photoDownloadURL ? { cardPhoto: photoDownloadURL } : {}),
        };

        await updateDoc(doc(db, "CardInfo_Table", cid), payload);
        toast.success("更新しました。");
        setPhotoFile(null);
        if (photoDownloadURL) setPhotoPreview(photoDownloadURL);
        setOrig((o) => (o ? { ...o, ...payload } as CardDoc : o));
      } catch (e) {
        console.error(e);
        toast.error("更新に失敗しました。");
      }
    });
  };

  const remove = async () => {
    if (!cid) return;
    if (!confirm("このカードを削除します。よろしいですか？")) return;
    await runWithLoading(async () => {
      try {
        await deleteDoc(doc(db, "CardInfo_Table", cid));
        toast.success("削除しました。");
        navigate(`/admin/kaitori/${id}/version/${vid}`);
      } catch (e) {
        console.error(e);
        toast.error("削除に失敗しました。");
      }
    });
  };

  if (loading || !orig) {
    return (
      <div className="page" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <Link to={`/admin/kaitori/${id}/version/${vid}`} style={{ color: "#0b5cff" }}>
          ← カード一覧へ戻る
        </Link>
        <h1 style={{ marginTop: 8 }}>{orig.versionName} / {orig.cardName}</h1>
        <div className="page-actions">
          <button className="ghost" onClick={remove}>削除</button>
          <button className="primary" onClick={save} disabled={!changed}>保存</button>
        </div>
      </div>

      <div className="modal-80" style={{ margin: 0 }}>
        <div className="card-form" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
          {/* 左側：圖片 */}
          <div className="card-form-left">
            <div className="imgbox">{photoPreview ? <img src={photoPreview} alt="preview" /> : <div className="img-empty">画像プレビュー</div>}</div>
            <label className="file-btn">画像を選択
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} hidden />
            </label>
            {orig.cardPhoto && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                現在のURL：<a href={orig.cardPhoto} target="_blank" rel="noreferrer">開く</a>
              </div>
            )}
          </div>

          {/* 右側：欄位 */}
          <div className="card-form-right">
            <div className="form-row">
              <label>カード名</label>
              <input value={cardName} onChange={(e) => setCardName(e.target.value)} />
            </div>

            <div className="form-row">
              <label>キャラクター</label>
              {!addingKyara ? (
                <div className="row-inline">
                  <select value={cardKyara} onChange={(e) => setCardKyara(e.target.value)}>
                    <option value="">（未選択）</option>
                    {kyaraOptions.map(k => <option key={k.id} value={k.cardKyaraName}>{k.cardKyaraName}</option>)}
                  </select>
                  <button type="button" className="mini-btn" onClick={() => setAddingKyara(true)}>＋ 新規追加</button>
                </div>
              ) : (
                <div className="row-inline">
                  <input value={newKyaraName} onChange={(e) => setNewKyaraName(e.target.value)} placeholder="キャラクター名を入力" />
                  <button
                    type="button"
                    className="mini-btn primary"
                    onClick={async () => {
                      if (!newKyaraName.trim()) { toast.error("キャラクター名を入力してください。"); return; }
                      await runWithLoading(() => addKyara(cardGameName, versionName, newKyaraName.trim()));
                      toast.success("キャラクターを追加しました。");
                      setCardKyara(newKyaraName.trim());
                      setNewKyaraName(""); setAddingKyara(false);
                    }}
                  >追加</button>
                  <button type="button" className="mini-btn" onClick={() => { setAddingKyara(false); setNewKyaraName(""); }}>キャンセル</button>
                </div>
              )}
            </div>

            <div className="form-row">
              <label>種類</label>
              {!addingType ? (
                <div className="row-inline">
                  <select value={cardType} onChange={(e) => setCardType(e.target.value)}>
                    <option value="">（未選択）</option>
                    {typeOptions.map(t => <option key={t.id} value={t.cardTypeName}>{t.cardTypeName}</option>)}
                  </select>
                  <button type="button" className="mini-btn" onClick={() => setAddingType(true)}>＋ 新規追加</button>
                </div>
              ) : (
                <div className="row-inline">
                  <input value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} placeholder="種類名を入力" />
                  <button
                    type="button" className="mini-btn primary"
                    onClick={async () => {
                      if (!newTypeName.trim()) { toast.error("種類名を入力してください。"); return; }
                      await runWithLoading(() => addType(cardGameName, versionName, newTypeName.trim()));
                      toast.success("種類を追加しました。");
                      setCardType(newTypeName.trim());
                      setNewTypeName(""); setAddingType(false);
                    }}
                  >追加</button>
                  <button type="button" className="mini-btn" onClick={() => { setAddingType(false); setNewTypeName(""); }}>キャンセル</button>
                </div>
              )}
            </div>

            <div className="form-row">
              <label>店頭買取価格</label>
              <input type="number" value={storePrice}
                onChange={(e) => setStorePrice(e.target.value === "" ? "" : Number(e.target.value))} min={0} />
            </div>

            <div className="form-row">
              <label>最低買取価格</label>
              <input type="number" value={minPrice}
                onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))} min={0} />
            </div>

            <div className="form-row">
              <label>募集枚数</label>
              <input type="number" value={wantedQty}
                onChange={(e) => setWantedQty(e.target.value === "" ? "" : Number(e.target.value))} min={0} />
            </div>

            <div className="form-actions" style={{ gap: 12 }}>
              <button className="ghost" type="button" onClick={() => navigate(-1)}>戻る</button>
              <button className="primary" type="button" onClick={save} disabled={!changed}>保存</button>
            </div>
          </div>
        </div>
      </div>

      {/* 全畫面 Loading */}
      {isBusy && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, backdropFilter: "blur(2px)"
        }}>
          <div style={{ display: "grid", placeItems: "center", gap: 12 }}>
            <LoadingSpinner />
            <div style={{ color: "#fff", fontWeight: 700, textShadow: "0 1px 2px rgba(0,0,0,.4)" }}>処理中…</div>
          </div>
        </div>
      )}
    </div>
  );
}
