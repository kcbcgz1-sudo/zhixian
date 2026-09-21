import { Platform } from 'react-native';

// 웹에서 가로 스크롤 영역(data-thinbar 속성)에:
//  - 얇은 검정 스크롤바
//  - 마우스 휠(세로)을 부드러운 가로 스크롤로 변환(이징 관성)
//  - 터치 관성 스크롤
export function injectThinBar() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const id = 'zx-thinbar-style';
  if (!document.getElementById(id)) {
    const s = document.createElement('style');
    s.id = id;
    s.textContent =
      '[data-thinbar]{scrollbar-width:thin;scrollbar-color:#111 transparent;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}' +
      '[data-thinbar]::-webkit-scrollbar{height:6px}' +
      '[data-thinbar]::-webkit-scrollbar-thumb{background:#111;border-radius:3px}' +
      '[data-thinbar]::-webkit-scrollbar-thumb:hover{background:#000}' +
      '[data-thinbar]::-webkit-scrollbar-track{background:transparent}';
    document.head.appendChild(s);
  }
  attachSmoothWheel();
  // ScrollView가 늦게 마운트될 수 있어 한 번 더
  setTimeout(attachSmoothWheel, 500);
}

function attachSmoothWheel() {
  if (typeof document === 'undefined') return;
  const els = document.querySelectorAll('[data-thinbar]');
  els.forEach((raw) => {
    const el = raw as HTMLElement & { __zxWheel?: boolean };
    if (el.__zxWheel) return;
    el.__zxWheel = true;

    let target = el.scrollLeft;
    let raf = 0;
    const tick = () => {
      const cur = el.scrollLeft;
      const diff = target - cur;
      if (Math.abs(diff) < 0.5) {
        el.scrollLeft = target;
        raf = 0;
        return;
      }
      el.scrollLeft = cur + diff * 0.18; // 이징(관성)
      raf = requestAnimationFrame(tick);
    };

    el.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        if (el.scrollWidth <= el.clientWidth) return; // 넘칠 게 없으면 무시
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // 이미 가로 스크롤이면 그대로
        e.preventDefault();
        if (!raf) target = el.scrollLeft; // 유휴 상태면 현재 위치와 동기화(직접 드래그 후 대비)
        const max = el.scrollWidth - el.clientWidth;
        target = Math.max(0, Math.min(max, target + e.deltaY));
        if (!raf) raf = requestAnimationFrame(tick);
      },
      { passive: false },
    );
  });
}
