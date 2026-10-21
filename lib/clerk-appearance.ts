import type { ClerkProvider } from "@clerk/nextjs";
import type { ComponentProps } from "react";

type Appearance = NonNullable<ComponentProps<typeof ClerkProvider>["appearance"]>;

/** Makes Clerk's prebuilt sign-in / sign-up cards match the app's palette and font. */
export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#5c2a0b",
    colorPrimaryForeground: "#f7f0e6",
    colorBackground: "#fdfaf5",
    colorForeground: "#3b1b0a",
    colorMutedForeground: "#8c6b52",
    colorMuted: "#f1e5d4",
    colorInput: "#f7f0e6",
    colorInputForeground: "#3b1b0a",
    colorBorder: "#e6d8c6",
    colorNeutral: "#5c2a0b",
    colorRing: "#a67845",
    colorDanger: "#c9693f",
    borderRadius: "1rem",
    fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
    fontFamilyButtons: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
    fontSize: "0.95rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none border border-line rounded-3xl",
    card: "rounded-3xl",
    headerTitle: "font-semibold tracking-tight",
    formButtonPrimary: "rounded-2xl font-medium normal-case shadow-none",
    socialButtonsBlockButton: "rounded-2xl",
    formFieldInput: "rounded-2xl",
    footer: "bg-transparent",
    footerAction: "bg-transparent",
  },
};
