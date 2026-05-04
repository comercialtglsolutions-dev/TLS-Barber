"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog"
import { Button } from "./ui/button"
import {
  QrCodeIcon,
  CreditCardIcon,
  Loader2Icon,
  AlertCircleIcon,
} from "lucide-react"
import { toast } from "sonner"
import { createPayment } from "@/app/_actions/create-payment"
import PixCheckoutDialog from "./pix-checkout-dialog"

interface PaymentCheckoutDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  amount: number
  serviceName: string
  itemId: string
  type: "SERVICE" | "PRODUCT"
  metadata?: any
  bookingId?: string
  barbershopId?: string
}

const PaymentCheckoutDialog = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  serviceName,
  itemId,
  type,
  metadata,
  bookingId = "",
  barbershopId = "",
}: PaymentCheckoutDialogProps) => {
  const [method, setMethod] = useState<"pix" | "card" | null>(null)
  const [loading, setLoading] = useState(false)
  const [pixOpen, setPixOpen] = useState(false)

  const handleSelectMethod = async (selectedMethod: "pix" | "card") => {
    if (selectedMethod === "pix") {
      // Abre o dialog de Pix nativo com chave da barbearia
      setPixOpen(true)
      return
    }

    if (selectedMethod === "card") {
      toast.info("Pagamento com cartão em manutenção.", {
        description:
          "Esta opção estará disponível em breve. Por favor, utilize o PIX no momento.",
        duration: 5000,
      })
      return
    }

    // Cartão: fluxo existente (gateway externo)
    setLoading(true)
    setMethod(selectedMethod)
    try {
      const result = await createPayment({
        itemId,
        type,
        method: selectedMethod,
        barbershopId,
        metadata,
      })

      if ((result as any).url) {
        setLoading(true)
        window.location.href = (result as any).url
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar pagamento")
      setMethod(null)
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={() => {
          if (!loading) {
            setMethod(null)
            onClose()
          }
        }}
      >
        <DialogContent className="w-[95%] max-w-md rounded-3xl border-white/10 bg-[#1A1A1A] p-8 sm:w-full">
          <DialogHeader className="flex flex-col items-center text-center">
            <DialogTitle className="text-2xl font-black text-white">
              Checkout
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Selecione como deseja pagar pelo serviço{" "}
              <strong className="text-[#2C78B2]">{serviceName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 flex flex-col gap-6">
            <div className="rounded-2xl border border-white/10 bg-[#121212] p-5 text-center">
              <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">
                Valor Total
              </h3>
              <p className="text-4xl font-black text-white">
                R$ {amount.toFixed(2).replace(".", ",")}
              </p>
            </div>

            {!method ? (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSelectMethod("pix")}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#222] p-6 transition-all hover:border-[#2C78B2]/50 hover:bg-[#2C78B2]/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2C78B2]/10 text-[#2C78B2] transition-colors group-hover:bg-[#2C78B2] group-hover:text-white">
                    <QrCodeIcon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-bold text-white">
                    Pagar com PIX
                  </span>
                </button>

                <button
                  onClick={() => handleSelectMethod("card")}
                  className="group relative flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#222] p-6 transition-all hover:border-orange-500/50 hover:bg-orange-500/5"
                >
                  <div className="absolute right-2 top-2 rounded-md bg-orange-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-tighter text-orange-400">
                    Em breve
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 transition-colors group-hover:bg-orange-500 group-hover:text-white">
                    <CreditCardIcon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-bold text-white">
                    Pagar com Cartão
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                {loading && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Loader2Icon className="h-12 w-12 animate-spin text-orange-500" />
                    <p className="text-sm font-medium text-gray-400">
                      Redirecionando para o pagamento...
                    </p>
                  </div>
                )}
                {!loading && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <AlertCircleIcon className="h-10 w-10 text-red-500" />
                    <p className="text-center text-sm text-gray-400">
                      Houve um imprevisto. Tente outro método ou reinicie.
                    </p>
                    <Button variant="ghost" onClick={() => setMethod(null)}>
                      Escolher outro
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 border-t border-white/5 pt-6 opacity-30">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Pagamento Seguro
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Pix nativo da barbearia */}
      <PixCheckoutDialog
        isOpen={pixOpen}
        onClose={() => {
          setPixOpen(false)
          onClose()
        }}
        onSuccess={() => {
          setPixOpen(false)
          if (onSuccess) {
            onSuccess()
          } else {
            onClose()
          }
        }}
        amount={amount}
        serviceName={serviceName}
        bookingId={bookingId}
        itemId={itemId}
        type={type}
        barbershopId={barbershopId}
        metadata={metadata}
      />
    </>
  )
}

export default PaymentCheckoutDialog
