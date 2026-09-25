import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Outfit } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { Web3Provider } from "@/components/providers/web3-provider";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Council",
  description:
    "Post a business or project idea with the research behind it. A panel of market analysts argues it out, a technical validator stress-tests whether it can be built, and the whole exchange is recorded on-chain post by post.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas">
        <Web3Provider>
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
        </Web3Provider>
      </body>
    </html>
  );
}
