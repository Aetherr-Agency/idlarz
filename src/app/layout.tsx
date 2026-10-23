import type { Metadata } from "next";
// Pixelify Sans (Google Fonts, OFL) - self-hosted via the fontsource package; exposes the
// "Pixelify Sans Variable" family used by --font-pixel in globals.css
import "@fontsource-variable/pixelify-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Idle Explorer",
  description: "An idle territory-expansion game: buy tiles, grow your castle, farm and trade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
