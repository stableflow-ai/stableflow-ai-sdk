import StableflowProvider from "@/providers/stableflow";
import RainbowKitProvider from "../providers";
import "./globals.css";
import Header from "@/sections/header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full h-full">
      <body className="w-full h-full">
        <StableflowProvider>
          <RainbowKitProvider>
            <Header />
            {children}
          </RainbowKitProvider>
        </StableflowProvider>
      </body>
    </html>
  );
}
