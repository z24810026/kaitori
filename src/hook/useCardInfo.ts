import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const CARD_INFO_COLLECTION = "CardInfo_Table";

export type CardInfo = {
  cardGameName: string;
  versionName: string;
  cardName: string;
  cardPhoto?: string; // 先放 URL；之後可接 Firebase Storage
  cardKyara?: string; // 直接存名稱（你要的是字串）
  cardType?: string; // 直接存名稱
  storePrice?: number; // 店頭買取価格
  minPrice?: number; // 最低買取価格
  wantedQty?: number; // 募集枚数
};

export async function addCardInfo(data: CardInfo) {
  await addDoc(collection(db, CARD_INFO_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
