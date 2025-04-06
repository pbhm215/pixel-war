//
// Layout für das Frontend (titel, favicon, fonts, etc.), nutzt den globalen CSS
//

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ // Sans-Schriftart
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({ // Mono-Schriftart
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Pixel War",
  description: "A pixel war game. Make pixel art and fight with others.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
