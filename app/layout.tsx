import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scrum Poker",
  description: "Estimativas colaborativas para times ágeis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
