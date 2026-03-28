// Re-exports lightTheme as the static Colors object.
// Screens that have been migrated to useTheme() no longer import from here.
export { lightTheme as Colors } from './themes';
export type { AppTheme as ColorKey } from './themes';
