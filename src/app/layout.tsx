import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
import { CompareProvider } from "@/lib/compare-context";
import { Header } from "@/components/header";
import { CompareTray } from "@/components/compare-tray";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

/** Display face for headings — friendlier than Inter, still precise. */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CollegeCompass — Find Your Right College",
  description:
    "Discover Indian colleges that match your rank and budget. Compare fees, placements, and cutoffs across 300+ institutions.",
  keywords: [
    "college search India",
    "engineering colleges",
    "NIRF ranking",
    "JEE colleges",
    "NEET colleges",
    "college comparison",
    "rank predictor",
  ],
};

/**
 * Applies the stored theme before first paint so dark-mode users never see
 * a white flash. Runs blocking in <head>; kept tiny on purpose.
 */
const themeBootScript = `
(function () {
  try {
    var stored = localStorage.getItem("cc-theme");
    var dark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <CompareProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <CompareTray />
          </CompareProvider>
        </Providers>
      </body>
    </html>
  );
}
