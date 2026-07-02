import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { Home, ShoppingCart, User } from 'lucide-react';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Instamart Smart Reorder",
  description: "Smart grocery reordering with privacy in mind",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="mobile-wrapper" id="mobile-wrapper">
          {children}
          
          <div className="bottom-nav">
            <Link href="/" className="nav-item">
              <Home size={24} />
              <span>Home</span>
            </Link>
            <Link href="/cart" className="nav-item" style={{ position: 'relative' }}>
              <ShoppingCart size={24} />
              <span>Cart</span>
              <div className="cart-badge" id="cart-badge">0</div>
            </Link>
            <Link href="/" className="nav-item">
              <User size={24} />
              <span>Profile</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
