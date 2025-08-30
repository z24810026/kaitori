// src/hooks/useUploadImage.ts
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";

/**
 * 上傳圖片並回傳永久網址（downloadURL）
 * @param file  <input type="file" /> 拿到的 File
 * @param path  存放到 Storage 的路徑（例：cardImages/{game}/{version}/{docId}.jpg）
 */

export async function uploadImageAndGetURL(
  file: File,
  path: string,
): Promise<string> {
  const objectRef = ref(storage, path);
  await uploadBytes(objectRef, file); // 上傳檔案
  const url = await getDownloadURL(objectRef); // 取得永久網址
  return url;
}
