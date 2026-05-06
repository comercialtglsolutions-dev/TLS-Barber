"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../_providers/auth"
import { useRouter, usePathname } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { AlertCircle, CreditCard } from "lucide-react"
import { Button } from "./ui/button"

const SubscriptionGuard = () => {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isBlocked, setIsBlocked] = useState(false)

  useEffect(() => {
    if (loading || !user || !profile || profile.role !== "ADMIN") {
      setIsBlocked(false)
      return
    }

    const now = new Date()
    let blocked = false

    // 1. Verificar EXPIRAÇÃO DE TESTE (FREE + trialEndsAt passado)
    if (profile.subscriptionPlan === "FREE") {
      const trialEnd = profile.trialEndsAt
        ? new Date(profile.trialEndsAt)
        : null
      if (trialEnd && trialEnd < now) {
        blocked = true
      }
    }
    // 2. Verificar EXPIRAÇÃO DE PLANO PAGO (BARBER/PREMIUM + nextInvoiceDate passado)
    else {
      const nextInvoice = (profile as any).nextInvoiceDate
        ? new Date((profile as any).nextInvoiceDate)
        : null
      // Damos uma tolerância de 24h para evitar bloqueio por delay de webhook
      const gracePeriod = 24 * 60 * 60 * 1000
      if (nextInvoice && nextInvoice.getTime() + gracePeriod < now.getTime()) {
        blocked = true
      }
    }

    setIsBlocked(blocked)

    // Se estiver bloqueado e não estiver na página de assinatura, redireciona
    if (
      blocked &&
      pathname !== "/admin/subscription" &&
      !pathname.includes("/auth")
    ) {
      router.push("/admin/subscription")
    }
  }, [user, profile, loading, pathname, router])

  // Se não estiver bloqueado ou estiver na página de assinatura, não exibe nada
  if (
    !isBlocked ||
    pathname === "/admin/subscription" ||
    pathname.includes("/auth")
  ) {
    return null
  }

  return (
    <Dialog open={isBlocked}>
      <DialogContent
        className="max-w-md border-red-500/20 bg-[#111111] p-8 shadow-2xl shadow-red-500/10"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <AlertCircle size={32} className="text-red-500" />
        </div>

        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-white">
            Acesso Suspenso
          </DialogTitle>
          <DialogDescription className="pt-2 text-gray-400">
            Sua assinatura expirou ou o período de teste de 15 dias chegou ao
            fim. Para continuar utilizando o sistema, você precisa escolher um
            plano superior.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-8 flex flex-col gap-3">
          <Button
            className="h-12 rounded-xl bg-[#2C78B2] font-bold text-white shadow-lg shadow-[#2C78B2]/20 hover:bg-[#1E5A8A]"
            onClick={() => router.push("/admin/subscription")}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Renovar Assinatura Agora
          </Button>

          <p className="text-center text-[10px] font-medium uppercase tracking-widest text-gray-500">
            O acesso será liberado instantaneamente após o pagamento
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SubscriptionGuard
