import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import Footer from "./_components/footer"
import AuthProvider from "./_providers/auth"
import WhatsAppButton from "./_components/whatsapp-button"
import { db } from "./_lib/prisma"
import OnboardingWizard from "./_components/onboarding-wizard"
import { createClient } from "./_lib/supabase/server"
import { getOnboardingStatus } from "./_actions/onboarding"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TLS Barber",
  description: "Sistema de gestão para barbearias",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await db.settings.findFirst()
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let initialOnboardingStatus = null
  if (authUser) {
    const user = await db.user.findUnique({ where: { id: authUser.id } })
    if (user?.role === "ADMIN") {
      try {
        initialOnboardingStatus = await getOnboardingStatus()
      } catch (e) {
        console.error("Erro ao buscar status do onboarding:", e)
      }
    }
  }

  return (
    <html lang="pt-br" className="dark bg-[#1D1D1D]">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex h-full flex-col">
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
          <WhatsAppButton phoneNumber={settings?.phones[0] || ""} />
          <OnboardingWizard initialStatus={initialOnboardingStatus} />
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
