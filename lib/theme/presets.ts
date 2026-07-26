export interface BackgroundPreset {
  key: string;
  label: string;
  light: string;
  dark: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { key: "sunrise", label: "Sunrise", light: "#fff4e6", dark: "#3a2a18" },
  { key: "mint", label: "Mint", light: "#e6f7f0", dark: "#123326" },
  { key: "sky", label: "Sky", light: "#e8f3fc", dark: "#122a3d" },
  { key: "lavender", label: "Lavender", light: "#f1ecfa", dark: "#2c2140" },
  { key: "blush", label: "Blush", light: "#fdecef", dark: "#3a1e24" },
  { key: "sand", label: "Sand", light: "#f7f1e3", dark: "#332b1a" },
  { key: "slate", label: "Slate", light: "#eef1f4", dark: "#1b2226" },
];

export const BACKGROUND_PRESET_KEYS = BACKGROUND_PRESETS.map((p) => p.key);

export function isValidBackgroundPreset(value: string): boolean {
  return BACKGROUND_PRESET_KEYS.includes(value);
}
