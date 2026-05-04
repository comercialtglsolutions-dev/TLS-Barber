"use client"

import { useState } from "react"
import { Button } from "@/app/_components/ui/button"
import { CheckIcon, XIcon, Loader2Icon } from "lucide-react"
import { verifyPixPayment } from "@/app/_actions/verify-pix-payment"
import { toast } from "sonner"

interface ConfirmPixButtonProps {
  bookingId: string
}

const ConfirmPixButton = ({ bookingId }: ConfirmPixButtonProps) => {
  const [loading, setLoading] = useState<"CONFIRM" | "REJECT" | null>(null)

  const handleVerify = async (action: "CONFIRM" | "REJECT") => {
    setLoading(action)
    try {
      await verifyPixPayment(bookingId, action)
      toast.success(
        action === "CONFIRM" ? "Pagamento confirmado!" : "Pagamento rejeitado!",
      )
    } catch (error) {
      toast.error("Erro ao processar verificação.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        size="icon"
        variant="outline"
        onClick={() => handleVerify("REJECT")}
        disabled={!!loading}
        className="h-8 w-8 border-red-500/50 text-red-500 hover:bg-red-500/10"
        title="Rejeitar Pix"
      >
        {loading === "REJECT" ? (
          <Loader2Icon className="h-4 w-4 animate-spin" />
        ) : (
          <XIcon className="h-4 w-4" />
        )}
      </Button>
      <Button
        size="sm"
        onClick={() => handleVerify("CONFIRM")}
        disabled={!!loading}
        className="h-8 gap-1 bg-green-600 px-2 text-[10px] font-bold text-white hover:bg-green-700"
      >
        {loading === "CONFIRM" ? (
          <Loader2Icon className="h-4 w-4 animate-spin" />
        ) : (
          <CheckIcon className="h-4 w-4" />
        )}
        Confirmar Pix
      </Button>
    </div>
  )
}

export default ConfirmPixButton
