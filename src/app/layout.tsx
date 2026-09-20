import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { LangProvider } from "@/components/lang";
import { WalletProvider } from "@/components/wallet";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin", "latin-ext"] });
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
});

const description =
  "Autonomous threat hunting for Soroban smart contracts. Let our agent break your contract before mainnet does.";

export const metadata: Metadata = {
  title: { default: "Z-FUZZ", template: "%s · Z-FUZZ" },
  description,
  openGraph: {
    title: "Z-FUZZ",
    description,
    siteName: "Z-FUZZ",
    type: "website",
    images: [{ url: "/og.jpg", width: 2848, height: 1504, alt: "Z-FUZZ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Z-FUZZ",
    description,
    images: ["/og.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrains.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-base text-fg">
        <LangProvider>
          <WalletProvider>{children}</WalletProvider>
        </LangProvider>
      </body>
    </html>
  );
}
