import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../firebase";

export const VERSION_COLLECTION = "CardGame_Version_Table";

export type VersionItem = {
  id: string; // VersionID (doc.id)
  cardGameName: string; // CardGameName
  versionName: string; // VersionName
  createdAt?: any;
};

const toModel = (d: DocumentData, id: string): VersionItem => ({
  id,
  cardGameName: d?.cardGameName ?? "",
  versionName: d?.versionName ?? "",
  createdAt: d?.createdAt ?? null,
});

/** 指定カードゲーム名のバージョン一覧を購読 */
export function useVersionList(cardGameName?: string) {
  const [items, setItems] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(!!cardGameName);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!cardGameName) return;
    const q = query(
      collection(db, VERSION_COLLECTION),
      where("cardGameName", "==", cardGameName),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => toModel(d.data(), d.id)));
        setLoading(false);
      },
      (e) => {
        setErr(e.message ?? "読み込みに失敗しました");
        setLoading(false);
      },
    );
    return () => unsub();
  }, [cardGameName]);

  return { items, loading, err };
}

/** 追加：VersionName を指定し、CardGameName は親から渡す */
export async function addVersion(cardGameName: string, versionName: string) {
  const ref = await addDoc(collection(db, VERSION_COLLECTION), {
    cardGameName,
    versionName,
    createdAt: serverTimestamp(),
  });
  return ref.id as string; // VersionID
}

/** 単体取得（必要なら） */
export async function getVersion(id: string) {
  const snap = await getDoc(doc(db, VERSION_COLLECTION, id));
  if (!snap.exists()) return null;
  return toModel(snap.data(), snap.id);
}
