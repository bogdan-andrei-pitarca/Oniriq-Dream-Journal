import './globals.css';
import { AuthProvider } from './context/AuthContext';
import { DreamProvider } from "./context/DreamContext";
import Navigation from './components/Navigation';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Dream Journal",
    description: "A journal for recording and analyzing your dreams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <Navigation />
          <DreamProvider>
            {children}
          </DreamProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
