import "./globals.css";
import Providers from "../components/Providers";

export const metadata = {
  title: "TCB POS & Staff Tab Manager",
  description: "High-density retail POS and staff tab management Progressive Web App",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TCB POS"
  }
};


export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-slate-950">
      <body className="min-h-full flex flex-col antialiased bg-slate-950 text-slate-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
