import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vince Matthew Magampon | IT Support & Automation Developer",
  description:
    "A futuristic interactive portfolio for Vince Matthew Magampon, showcasing IT support, workflow automation, troubleshooting, and systems development.",
  keywords: [
    "Vince Matthew Magampon",
    "IT Support",
    "Automation Developer",
    "Power Apps",
    "Power Automate",
    "Workflow Automation",
    "WordPress",
    "Excel Automation"
  ],
  openGraph: {
    title: "Vince Matthew Magampon | IT Support & Automation Developer",
    description:
      "Explore a cyberpunk command-center portfolio with automation projects, an RPG skill tree, terminal interface, and Fix The System mini-game.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
