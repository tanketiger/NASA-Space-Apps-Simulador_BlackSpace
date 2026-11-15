import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Fredoka } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

const chakra = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-chakra",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aurora Outpost · Tu primer turno en Marte",
  description:
    "Juego de cabina para niños: sube el escudo a tiempo, vigila las cámaras y sobrevive hasta las 06:00 AM en el puesto avanzado de Marte.",
};

export const viewport: Viewport = {
  themeColor: "#0F1B3D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fredoka.variable} ${chakra.variable}`}>
      <body>{children}</body>
    </html>
  );
}
