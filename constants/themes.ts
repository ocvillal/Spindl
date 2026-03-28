export const lightTheme = {
  // Backgrounds
  background:  '#F2E9E4',   // Seashell
  surface:     '#EAE0DA',   // warm white — cards
  surfaceAlt:  '#C9ADA7',   // Almond Silk — nested surfaces
  surfaceHigh: '#DDD5CE',   // mid warm — highlights

  // Brand
  primary:    '#4A4E69',    // Dusty Grape — buttons, links, active states
  primaryDim: '#4A4E6930',
  accent:     '#9A8C98',    // Lilac Ash — secondary accent
  accentDim:  '#9A8C9830',

  // Text
  text:          '#22223B', // Space Indigo — main text
  textSecondary: '#4A4E69', // Dusty Grape — secondary text
  muted:         '#9A8C98', // Lilac Ash — placeholder / hint text

  // UI
  border:  '#C9ADA7',       // Almond Silk
  divider: '#D8CFC9',       // soft warm divider

  // Ratings
  star:      '#4A4E69',     // Dusty Grape
  starEmpty: '#C9ADA7',     // Almond Silk

  // Status
  online: '#9A8C98',        // Lilac Ash
};

export const darkTheme = {
  // Backgrounds
  background:  '#22223B',   // Space Indigo
  surface:     '#2D2D47',   // mid-indigo — cards
  surfaceAlt:  '#4A4E69',   // Dusty Grape — nested surfaces
  surfaceHigh: '#3A3D5C',   // highlights

  // Brand
  primary:    '#C9ADA7',    // Almond Silk — buttons, links, active states
  primaryDim: '#C9ADA730',
  accent:     '#9A8C98',    // Lilac Ash
  accentDim:  '#9A8C9830',

  // Text
  text:          '#F2E9E4', // Seashell — main text
  textSecondary: '#C9ADA7', // Almond Silk — secondary text
  muted:         '#9A8C98', // Lilac Ash — placeholder / hint text

  // UI
  border:  '#4A4E69',       // Dusty Grape
  divider: '#3A3D5C',

  // Ratings
  star:      '#C9ADA7',     // Almond Silk
  starEmpty: '#4A4E69',     // Dusty Grape

  // Status
  online: '#9A8C98',        // Lilac Ash
};

export type AppTheme = typeof lightTheme;
