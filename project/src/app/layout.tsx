import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "../../context/AuthProvider";
import { Toaster } from "sonner";
import Wrapper from "@/components/navbars/Wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillConnect",
  description: "Connect with talent and showcase your skills",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        
        <AuthProvider>
          <Wrapper>
            {children}
          </Wrapper>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}