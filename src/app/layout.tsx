import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./norse-bold.css";
import {
  ThemeModeScript,
} from "flowbite-react";
import ThemeToggleWatcher from "./_components/ThemeToggleWatcher";
import { NavBar } from "./navBar";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Läss",
  description: "An app for learning Swedish",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1.0,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ThemeModeScript />
      </head>
      <body className={inter.className}>
        <NavBar />
        <ThemeToggleWatcher />
        <main className="p-2 sm:p-4 text-gray-900 dark:text-white h-[calc(100vh-63px)] overflow-y-scroll">
          {children}
        </main>
      </body>
    </html>
  );
}
