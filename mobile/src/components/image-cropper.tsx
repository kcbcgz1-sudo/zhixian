// 知闲 · 이미지 크롭 모달 (프레임 안에서 드래그 + 확대/축소 → 필요한 부분만 등록)
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Brand, F, R, S } from '@/constants/brand';
import { cropImage } from '@/data/image';

type Props = {
  visible: boolean;
  uri: string;
  imgW: number;
  imgH: number;
  aspect: number; // 가로/세로 비율 (1 = 정사각형, 16/9 = 와이드)
  outWidth?: number; // 결과 가로 픽셀 상한
  onCancel: () => void;
  onDone: (uri: string) => void;
};

export default function ImageCropper({ visible, uri, imgW, imgH, aspect, outWidth = 1024, onCancel, onDone }: Props) {
  const win = Dimensions.get('window').width;
  const FRAME_W = Math.min(win - 48, 340);
  const FRAME_H = FRAME_W / aspect;
  const baseScale = Math.max(FRAME_W / imgW, FRAME_H / imgH);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const zoomRef = useRef(1);
  const panStart = useRef({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });

  const bounds = (z: number) => {
    const s = baseScale * z;
    return { mx: Math.max(0, (imgW * s - FRAME_W) / 2), my: Math.max(0, (imgH * s - FRAME_H) / 2) };
  };
  const clamp = (x: number, y: number, z: number) => {
    const b = bounds(z);
    return { x: Math.max(-b.mx, Math.min(b.mx, x)), y: Math.max(-b.my, Math.min(b.my, y)) };
  };

  const pan2 = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => { panStart.current = { ...panRef.current }; },
        onPanResponderMove: (_e, g) => {
          const next = clamp(panStart.current.x + g.dx, panStart.current.y + g.dy, zoomRef.current);
          panRef.current = next;
          setPan(next);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [imgW, imgH, FRAME_W, FRAME_H],
  );

  const setZoomClamped = (z: number) => {
    const nz = Math.max(1, Math.min(4, z));
    zoomRef.current = nz;
    setZoom(nz);
    const c = clamp(panRef.current.x, panRef.current.y, nz);
    panRef.current = c;
    setPan(c);
  };

  const scale = baseScale * zoom;
  const dispW = imgW * scale;
  const dispH = imgH * scale;

  async function confirm() {
    if (busy) return;
    setBusy(true);
    try {
      const originX = (dispW / 2 - FRAME_W / 2 - pan.x) / scale;
      const originY = (dispH / 2 - FRAME_H / 2 - pan.y) / scale;
      const cropW = FRAME_W / scale;
      const cropH = FRAME_H / scale;
      const ox = Math.max(0, Math.min(imgW - cropW, originX));
      const oy = Math.max(0, Math.min(imgH - cropH, originY));
      const out = await cropImage(uri, { originX: ox, originY: oy, width: cropW, height: cropH }, outWidth);
      onDone(out);
    } catch {
      onDone(uri);
    } finally {
      setBusy(false);
    }
  }

  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Text style={styles.title}>调整裁剪区域</Text>
        <Text style={styles.sub}>拖动图片，用按钮缩放，只保留需要的部分</Text>
        <View style={[styles.frame, { width: FRAME_W, height: FRAME_H }]} {...pan2.panHandlers}>
          <Image
            source={{ uri }}
            style={{ position: 'absolute', width: dispW, height: dispH, left: FRAME_W / 2 - dispW / 2 + pan.x, top: FRAME_H / 2 - dispH / 2 + pan.y }}
            contentFit="fill"
          />
          <View style={styles.grid} pointerEvents="none" />
        </View>

        <View style={styles.zoomRow}>
          <Pressable style={styles.zoomBtn} onPress={() => setZoomClamped(zoom - 0.25)} hitSlop={8}>
            <Ionicons name="remove" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
          <Pressable style={styles.zoomBtn} onPress={() => setZoomClamped(zoom + 0.25)} hitSlop={8}>
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable style={[styles.btn, styles.cancel]} onPress={onCancel} disabled={busy}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.ok]} onPress={confirm} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.okText}>确定</Text>}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: S.lg, gap: S.md },
  title: { color: '#fff', fontSize: F.h2, fontWeight: '800' },
  sub: { color: '#D6DADE', fontSize: F.small, marginTop: -6 },
  frame: { overflow: 'hidden', backgroundColor: '#111', borderRadius: R.md, borderWidth: 2, borderColor: '#fff' },
  grid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderColor: 'rgba(255,255,255,0.25)' },
  zoomRow: { flexDirection: 'row', alignItems: 'center', gap: S.lg, marginTop: S.sm },
  zoomBtn: { width: 44, height: 44, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  zoomText: { color: '#fff', fontSize: F.body, fontWeight: '700', minWidth: 56, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: S.md, marginTop: S.md, width: '100%', maxWidth: 360 },
  btn: { flex: 1, height: 50, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: 'rgba(255,255,255,0.18)' },
  cancelText: { color: '#fff', fontSize: F.body, fontWeight: '700' },
  ok: { backgroundColor: Brand.green },
  okText: { color: '#fff', fontSize: F.body, fontWeight: '800' },
});
