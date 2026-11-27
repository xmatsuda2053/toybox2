import {
  applyThemeToRoot,
  createThemeStorage,
  getSystemPrefersDark,
  resolveEffectiveTheme,
  resolveStorageArea,
  type StorageAreaLike,
  type ThemeRootLike,
} from "@shared/utils";

export const THEME_STORAGE_KEY = "hubaddress_theme";

const themeStorage = createThemeStorage(THEME_STORAGE_KEY);

export const { loadTheme, saveTheme } = themeStorage;

export {
  applyThemeToRoot,
  getSystemPrefersDark,
  resolveEffectiveTheme,
  resolveStorageArea,
  type StorageAreaLike,
  type ThemeRootLike,
};
