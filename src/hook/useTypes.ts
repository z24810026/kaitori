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

export const TYPE_COLLECTION = "CardType_Table";

export type TypeItem = {
  id: string;
  cardGameName: string;
  versionName: string;
  cardTypeName: string;
};

export function useTypeOptions(cardGameName?: string, versionName?: string) {
  const [items, setItems] = useState<TypeItem[]>([]);
  useEffect(() => {
    if (!cardGameName || !versionName) {
      setItems([]);
      return;
    }
    const q = query(
      collection(db, TYPE_COLLECTION),
      where("cardGameName", "==", cardGameName),
      where("versionName", "==", versionName),
      orderBy("cardTypeName", "asc")
    );
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          cardGameName: d.get("cardGameName"),
          versionName: d.get("versionName"),
          cardTypeName: d.get("cardTypeName"),
        }))
      );
    });
  }, [cardGameName, versionName]);
  return items;
}

export async function addType(
  cardGameName: string,
  versionName: string,
  cardTypeName: string
) {
  await addDoc(collection(db, TYPE_COLLECTION), {
    cardGameName,
    versionName,
    cardTypeName,
    createdAt: serverTimestamp(),
  });
}
