import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../firebase";

export const CARD_GAME_COLLECTION = "CardGame_Name_Table";

export type CardGame = {
  id: string; // Firestore doc.id（CardGameID）
  name: string; // CardGameName
  createdAt?: any;
  updatedAt?: any;
};

const toModel = (d: DocumentData, id: string): CardGame => ({
  id,
  name: d?.name ?? "",
  createdAt: d?.createdAt ?? null,
  updatedAt: d?.updatedAt ?? null,
});

/** 一覧を購読 */
export function useCardGameList() {
  const [items, setItems] = useState<CardGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    const q = query(
      collection(db, CARD_GAME_COLLECTION),
      orderBy("createdAt", "desc"), // ← 需要單欄索引；若出錯請先新增/回填 createdAt
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => toModel(d.data(), d.id));
        // 沒有 createdAt 的資料放到最後，避免卡在最上面
        rows.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setItems(rows);
        setLoading(false);
      },
      (e) => {
        setErr(e?.message ?? "読み込みに失敗しました");
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  return { items, loading, err };
}

/** 追加（CardGameName のみ指定; CardGameID は doc.id 自動採番） */
export async function addCardGame(name: string) {
  const ref = await addDoc(collection(db, CARD_GAME_COLLECTION), {
    name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id as string;
}

/** 更新（名稱修改） */
export async function updateCardGame(id: string, name: string) {
  await updateDoc(doc(db, CARD_GAME_COLLECTION, id), {
    name,
    updatedAt: serverTimestamp(),
  });
}

/** 刪除 */
export async function deleteCardGame(id: string) {
  await deleteDoc(doc(db, CARD_GAME_COLLECTION, id));
}

/** 單筆取得 */
export async function getCardGame(id: string) {
  const snap = await getDoc(doc(db, CARD_GAME_COLLECTION, id));
  if (!snap.exists()) return null;
  return toModel(snap.data(), snap.id);
}

/** 單筆訂閱（詳細頁用） */
export function useCardGame(id?: string) {
  const [item, setItem] = useState<CardGame | null>(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    const ref = doc(db, CARD_GAME_COLLECTION, id);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setItem(snap.exists() ? toModel(snap.data(), snap.id) : null);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [id]);

  return { item, loading };
}
