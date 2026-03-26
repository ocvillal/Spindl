export const Colors = {
  // Backgrounds
  background: '#F0EAD2',    // vanilla cream — main background
  surface: '#E6DEC4',       // slightly deeper vanilla cream for cards
  surfaceAlt: '#DAD3B5',    // deeper for nested surfaces
  surfaceHigh: '#DDE5B6',   // ~cream (olive-tinted) for highlights

  // Brand
  primary: '#ADC178',       // muted olive — buttons, links, active states
  primaryDim: '#ADC17830',
  accent: '#A98467',        // faded copper — secondary accent
  accentDim: '#A9846730',

  // Text
  text: '#6C584C',          // ash brown — main text
  textSecondary: '#A98467', // faded copper — secondary text
  muted: '#B5A882',         // muted warm beige-brown

  // UI
  border: '#D6CEB2',        // warm beige border
  divider: '#DDD7C0',       // soft warm divider

  // Ratings
  star: '#ADC178',          // muted olive
  starEmpty: '#D6CEB2',

  // Status
  online: '#ADC178',
};

export type ColorKey = keyof typeof Colors;
