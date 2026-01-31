import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CallHot",
  description: "Simulador de chamada por link",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "'Inter', sans-serif" }}>{children}</body>
    </html>
  );
}
