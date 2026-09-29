// 知闲 · 이미지 전처리 (업로드 전 축소·압축·크롭) — expo-image-manipulator
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// 긴 변을 maxSize 이하로 줄이고 JPEG로 재압축 (폰 원본 대용량 방지)
export async function shrinkImage(
  uri: string,
  w?: number,
  h?: number,
  maxSize = 1600,
  quality = 0.82,
): Promise<string> {
  try {
    const actions: any[] = [];
    if (w && h && Math.max(w, h) > maxSize) {
      if (w >= h) actions.push({ resize: { width: maxSize } });
      else actions.push({ resize: { height: maxSize } });
    }
    const r = await manipulateAsync(uri, actions, { compress: quality, format: SaveFormat.JPEG });
    return r.uri;
  } catch {
    return uri;
  }
}

// 크롭 후 outWidth 이하로 리사이즈 + 압축
export async function cropImage(
  uri: string,
  crop: { originX: number; originY: number; width: number; height: number },
  outWidth = 1024,
  quality = 0.85,
): Promise<string> {
  const actions: any[] = [{ crop }];
  if (crop.width > outWidth) actions.push({ resize: { width: outWidth } });
  const r = await manipulateAsync(uri, actions, { compress: quality, format: SaveFormat.JPEG });
  return r.uri;
}
