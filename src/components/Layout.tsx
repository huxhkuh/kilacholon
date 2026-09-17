import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import ContentStatus from "./ContentStatus";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <a href="#main-content" className="skip-link">דילוג לתוכן</a>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none"><ContentStatus />{children}</main>
      <Footer />
    </div>
  );
}
