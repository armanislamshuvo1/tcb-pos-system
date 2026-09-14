import "./globals.css";
import Providers from "../components/Providers";

export const metadata = {
  title: "TCB POS & Staff Tab Manager",
  description: "High-density retail POS and staff tab management Progressive Web App",
  manifest: "/manifest.json"
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
