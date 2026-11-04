import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Container 3D Viewer",
  description: "An interactive 3D container-truck viewer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
