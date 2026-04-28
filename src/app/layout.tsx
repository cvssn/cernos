import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cernos — Living Weather",
  description:
    "A dynamic weather app whose entire interface morphs to match the sky. Forecasts, air quality, and AI-powered insights.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.open-meteo.com" />
        <link rel="preconnect" href="https://geocoding-api.open-meteo.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
