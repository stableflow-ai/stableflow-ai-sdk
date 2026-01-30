import StableflowProvider from "@/providers/stableflow";
import RainbowKitProvider from "../providers";
import "./globals.css";

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
            {children}
          </RainbowKitProvider>
        </StableflowProvider>
      </body>
    </html>
  );
}
