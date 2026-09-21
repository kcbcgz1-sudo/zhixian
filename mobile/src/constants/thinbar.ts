import { Platform } from 'react-native';

// 웹에서 가로 스크롤 영역(data-thinbar 속성)에 얇은 검정 스크롤바 CSS 주입
export function injectThinBar() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const id = 'zx-thinbar-style';
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent =
    '[data-thinbar]{scrollbar-width:thin;scrollbar-color:#111 transparent}' +
    '[data-thinbar]::-webkit-scrollbar{height:5px}' +
    '[data-thinbar]::-webkit-scrollbar-thumb{background:#111;border-radius:3px}' +
    '[data-thinbar]::-webkit-scrollbar-track{background:transparent}';
  document.head.appendChild(s);
}
