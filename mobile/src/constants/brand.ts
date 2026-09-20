// 知闲 · 디자인 토큰 (피그마 기준)
// 색/여백/폰트 크기를 한곳에서 관리. 화면들은 이 값만 가져다 씀.
export const Brand = {
  // 메인 그린
  green: '#35BF63',
  greenDark: '#1E9E52',
  greenDeep: '#0C7A34', // 프로필 헤더 상단(짙은 초록)
  greenSoft: '#E8F7EE', // 아주 옅은 초록 배경

  // 중립색
  bg: '#F3F5F6', // 앱 배경(연한 회색)
  card: '#FFFFFF',
  text: '#1F2024', // 제목/본문(거의 검정)
  textSub: '#8A9099', // 보조 텍스트(회색)
  textFaint: '#B8BEC5', // 더 옅은 회색
  border: '#ECEEF0',
  white: '#FFFFFF',

  // 액센트
  danger: '#E8552D', // 干货 배지 등 강조
} as const;

// 여백 스케일
export const S = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// 폰트 크기(45~55세 타깃 → 넉넉하게)
export const F = {
  brand: 30,
  title: 20,
  h2: 18,
  body: 16,
  sub: 14,
  small: 13,
  tiny: 12,
} as const;

// 둥근 모서리
export const R = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;
