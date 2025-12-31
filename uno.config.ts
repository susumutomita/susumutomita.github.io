// uno.config.ts
import { defineConfig } from "unocss";
import { presetWind4 } from "@unocss/preset-wind4";

export default defineConfig({
  content: {
    filesystem: ["**/*.{html,js,ts,jsx,tsx,vue,svelte,astro}"],
  },
  theme: {
    boxShadow: {
      custom: `2px 2px 0`,
      "custom-hover": `1px 1px 0`,
      sm: "0 1px 2px rgba(0,0,0,0.05)",
      md: "0 4px 6px rgba(0,0,0,0.07)",
      lg: "0 10px 15px rgba(0,0,0,0.1)",
    },
    fontFamily: {
      sans: ["CabinetGrotesk", "Satoshi"],
      display: ["CabinetGrotesk"],
      body: ["Satoshi"],
    },
    gridTemplateRows: {
      "auto-250": "repeat(auto-fill, 250px)",
    },
    gridTemplateColumns: {
      "4-minmax": "repeat(4, minmax(150px, 1fr))",
    },
    colors: {
      gray: {
        50: "#FAFAFA",
        100: "#F5F5F5",
        200: "#E5E5E5",
        300: "#D4D4D4",
        400: "#A3A3A3",
        500: "#737373",
        600: "#525252",
        700: "#404040",
        800: "#262626",
        900: "#171717",
      },
      darkslate: {
        50: "#3D3D3D",
        100: "#2C2C2C",
        200: "#262626",
        300: "#202020",
        400: "#1A1A1A",
        500: "#171717",
        600: "#141414",
        700: "#111111",
        800: "#0E0E0E",
        900: "#0B0B0B",
      },
      // Keep primary for backwards compatibility
      primary: {
        100: "#F9CDD3",
        200: "#F3A3AA",
        300: "#EC7981",
        400: "#E64F59",
        500: "#E63946",
        600: "#CF2F3D",
        700: "#B82534",
        800: "#A01B2B",
        900: "#891321",
      },
      // HybridNext accent colors (blue)
      accent: {
        50: "#f0f7ff",
        100: "#e0efff",
        200: "#b8d4f0",
        300: "#99c4e8",
        400: "#81a2be",
        500: "#81a2be",
        600: "#6a8aa8",
        700: "#547292",
        800: "#3e5a7c",
        900: "#284266",
      },
      // HybridNext palette
      hybrid: {
        blue: "#81a2be",
        brightBlue: "#99dbff",
        cyan: "#5e8d87",
        brightCyan: "#8abeb7",
        green: "#8c9440",
        brightGreen: "#b5bd68",
        yellow: "#de935f",
        brightYellow: "#f0c674",
        red: "#a54242",
        brightRed: "#cc6666",
        magenta: "#85678f",
        brightMagenta: "#b294bb",
      },
      // Light mode semantic colors
      light: {
        bg: "#f5f7f8",
        surface: "#ffffff",
        text: "#242e33",
        muted: "#6c7a80",
        border: "#d4dade",
      },
      // Dark mode semantic colors (HybridNext)
      dark: {
        bg: "#1d2528",
        surface: "#242e33",
        text: "#c5c8c6",
        muted: "#6c7a80",
        border: "#3a4449",
      },
    },
  },
  presets: [
    presetWind4() as any,
  ],
});
