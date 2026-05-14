import type { Metadata } from "next"
import "./globals.css"
import "mapbox-gl/dist/mapbox-gl.css"

export const metadata: Metadata = {
  title: "SentinelX | SIEM & SOC Platform",
  description: "Cloud-native enterprise SIEM platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-background text-foreground min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  )
}
