import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export const KYARA_COLLECTION = "CardKyara_Table";

export type KyaraItem = {
  id: string;
  cardGameName: string;
  versionName: string;
  cardKyaraName: string;
};

export function useKyaraOptions(cardGameName?: string, versionName?: string) {
  const [items, setItems] = useState<KyaraItem[]>([]);
  useEffect(() => {
    if (!cardGameName || !versionName) {
      setItems([]);
      return;
    }
    const q = query(
      collection(db, KYARA_COLLECTION),
      where("cardGameName", "==", cardGameName),
      where("versionName", "==", versionName),
      orderBy("cardKyaraName", "asc"),
    );
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          cardGameName: d.get("cardGameName"),
          versionName: d.get("versionName"),
          cardKyaraName: d.get("cardKyaraName"),
        })),
      );
    });
  }, [cardGameName, versionName]);
  return items;
}

export async function addKyara(
  cardGameName: string,
  versionName: string,
  cardKyaraName: string,
) {
  await addDoc(collection(db, KYARA_COLLECTION), {
    cardGameName,
    versionName,
    cardKyaraName,
    createdAt: serverTimestamp(),
  });
}
