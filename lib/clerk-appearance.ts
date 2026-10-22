import type { ClerkProvider } from "@clerk/nextjs";
import type { ComponentProps } from "react";

type Appearance = NonNullable<ComponentProps<typeof ClerkProvider>["appearance"]>;

/** Makes Clerk's prebuilt sign-in / sign-up cards match the app's palette and type. */
export const clerkAppearance: Appearance = {
  options: {
    // Dev-instance badge under the card; no use to visitors.
    unsafe_disableDevelopmentModeWarnings: true,
  },
  variables: {
    colorPrimary: "#223030",
    colorPrimaryForeground: "#efefe9",
    colorBackground: "#ffffff",
    colorForeground: "#223030",
    colorMutedForeground: "#727a74",
    colorMuted: "#f4ece4",
    colorInput: "#ffffff",
    colorInputForeground: "#223030",
    colorBorder: "#e1dbd2",
    colorNeutral: "#223030",
    colorRing: "#959d90",
    colorDanger: "#8b4a3a",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
    fontFamilyButtons: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
    fontSize: "0.9rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none border border-line rounded-xl",
    card: "rounded-xl px-6 py-7",
    headerTitle: "font-semibold tracking-tight text-lg",
    headerSubtitle: "text-muted",
    formButtonPrimary: "rounded-lg font-medium normal-case shadow-none h-10",
    socialButtonsBlockButton: "rounded-lg h-10",
    formFieldInput: "rounded-lg h-10",
    footer: "bg-transparent",
    footerAction: "bg-transparent",
  },
};
