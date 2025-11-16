import type { Config } from "tailwindcss";

// Import colors from React Native UI Library configuration
// This ensures consistency between web (Tailwind) and mobile (UI Library)
const uiLibColors = {
  primary: "#4CCCE6",
  primaryAlpha: "#52E1FEE5",
  primary10: "#004558",
  primary20: "#003848",
  primary30: "#045468",
  primary40: "#12677E",
  primary50: "#11809C",
  primary60: "#00A2C7",
  primary70: "#23AFD0",
  primary80: "#4CCCE6",
  
  secondary: "#202221",
  secondary10: "#202221",
  secondary20: "#272A29",
  
  background: "#202221",
  backgroundDark: "#151718",
  surface: "#2E3130",
  surfaceDark: "#1e293b",
  card: "#2E3130",
  cardDark: "#1e293b",
  
  text: "#ECEDEE",
  textSecondary: "#94a3b8",
  
  tint: "#4CCCE6",
  tintDark: "#52E1FEE5",
  icon: "#9BA1A6",
  
  gradientStart: "#003848",
  gradientEnd: "#4CCCE6",
  gradientStartDark: "#202221",
  gradientEndDark: "#272A29",
  
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#4CCCE6",
};

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Zimam Brand Colors - now synced with UI Library
        zimam: {
          primary: uiLibColors.primary,
          primaryAlpha: uiLibColors.primaryAlpha,
          50: uiLibColors.primary80,
          100: uiLibColors.primary70,
          200: uiLibColors.primary60,
          300: uiLibColors.primary50,
          400: uiLibColors.primary40,
          500: uiLibColors.primary30,
          600: uiLibColors.primary20,
          700: uiLibColors.primary10,
        },
        zimamdark: {
          primary: uiLibColors.secondary,
          secondary: uiLibColors.secondary20,
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
