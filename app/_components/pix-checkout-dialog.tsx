"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog"
import { Button } from "./ui/button"
import {
  CheckCircle2Icon,
  CopyIcon,
  QrCodeIcon,
  Loader2Icon,
  AlertTriangleIcon,
  SmartphoneIcon,
} from "lucide-react"
import { toast } from "sonner"
import { confirmPixPayment } from "../_actions/confirm-pix-payment"
import { getPixSettings } from "../_actions/get-pix-settings"

// @ts-ignore
import * as PixModule from "pix-payload"
import QRCode from "qrcode"

interface PixCheckoutDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  amount: number
  serviceName: string
  bookingId: string
  itemId: string
  type: "SERVICE" | "PRODUCT"
  barbershopId: string
  metadata?: any
}

const PixCheckoutDialog = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  serviceName,
  bookingId,
  itemId,
  type,
  barbershopId,
  metadata,
}: PixCheckoutDialogProps) => {
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [pixCopiaECola, setPixCopiaECola] = useState("")
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("")
  const [pixSettings, setPixSettings] = useState<{
    pixKey: string | null
    pixKeyType: string | null
    pixBeneficiary: string | null
  } | null>(null)

  useEffect(() => {
    if (!isOpen || !barbershopId) return

    const loadPixData = async () => {
      setLoading(true)
      setConfirmed(false)
      try {
        const settings = await getPixSettings(barbershopId)
        setPixSettings(settings)

        if (!settings.pixKey || !settings.pixBeneficiary) {
          setLoading(false)
          return
        }

        // Gera o payload Pix (EMV) usando pix-payload
        // A biblioteca pix-payload pode exportar de diferentes formas dependendo do bundler
        const payloadFn = (PixModule as any).payload || PixModule

        if (typeof payloadFn !== "function") {
          throw new Error(
            "Falha ao carregar gerador de Pix. Verifique a biblioteca pix-payload.",
          )
        }

        const payloadStr = payloadFn({
          key: settings.pixKey,
          name: settings.pixBeneficiary,
          city: "SAO PAULO",
          amount: Number(amount.toFixed(2)),
          transactionId: `TLS${(bookingId || "0000").slice(0, 8).toUpperCase()}`,
        })

        setPixCopiaECola(payloadStr)

        // Gera o QR Code como Data URL
        const qr = await QRCode.toDataURL(payloadStr, {
          width: 200,
          margin: 1,
          color: { dark: "#000000", light: "#ffffff" },
        })
        setQrCodeDataUrl(qr)
      } catch (error) {
        console.error("Erro ao gerar Pix:", error)
        toast.error("Erro ao gerar código Pix")
      } finally {
        setLoading(false)
      }
    }

    loadPixData()
  }, [isOpen, barbershopId, amount, bookingId])

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCopiaECola)
    toast.success("Código Pix copiado!")
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await confirmPixPayment({
        bookingId,
        itemId,
        type,
        barbershopId,
        metadata,
      })
      setConfirmed(true)
      toast.success(
        "Pagamento reportado! O barbeiro será notificado para confirmar.",
      )
    } catch (error) {
      toast.error("Erro ao confirmar pagamento")
    } finally {
      setConfirming(false)
    }
  }

  const hasPixConfig = pixSettings?.pixKey && pixSettings?.pixBeneficiary

  return (
    <Dialog
      open={isOpen}
      onOpenChange={confirmed ? onSuccess || onClose : undefined}
    >
      <DialogContent className="w-[90%] max-w-md rounded-2xl border-white/10 bg-[#1A1A1A] p-6 sm:w-full [&>button]:text-white">
        <DialogHeader className="flex flex-col items-center text-center">
          <div
            className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
              confirmed
                ? "bg-green-500/20"
                : hasPixConfig
                  ? "bg-[#2C78B2]/20"
                  : "bg-yellow-500/20"
            }`}
          >
            {confirmed ? (
              <CheckCircle2Icon className="h-8 w-8 text-green-500" />
            ) : hasPixConfig ? (
              <QrCodeIcon className="h-8 w-8 text-[#2C78B2]" />
            ) : (
              <AlertTriangleIcon className="h-8 w-8 text-yellow-500" />
            )}
          </div>

          <DialogTitle className="text-2xl font-bold text-white">
            {confirmed
              ? "Pagamento Reportado!"
              : hasPixConfig
                ? "Pagar via Pix"
                : "Pix não configurado"}
          </DialogTitle>

          <DialogDescription className="text-center text-sm text-gray-400">
            {confirmed
              ? "O barbeiro será notificado e confirmará o pagamento após verificar o extrato."
              : hasPixConfig
                ? `Escaneie o QR Code ou copie o código Pix para pagar R$ ${amount.toFixed(2).replace(".", ",")}`
                : "Este estabelecimento ainda não configurou uma chave Pix para recebimentos."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2Icon className="h-8 w-8 animate-spin text-[#2C78B2]" />
              <p className="text-sm text-gray-400">Gerando código Pix...</p>
            </div>
          ) : confirmed ? (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center">
              <p className="text-sm text-green-400">
                ✅ Notificação enviada ao barbeiro. Aguarde a confirmação do
                pagamento.
              </p>
            </div>
          ) : hasPixConfig ? (
            <>
              {/* Valor */}
              <div className="rounded-xl border border-white/10 bg-[#121212] p-4 text-center">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {serviceName}
                </h3>
                <p className="text-3xl font-bold text-white">
                  R$ {amount.toFixed(2).replace(".", ",")}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-2">
                {qrCodeDataUrl ? (
                  <div className="rounded-xl bg-white p-3 shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code Pix"
                      width={180}
                      height={180}
                    />
                  </div>
                ) : (
                  <div className="flex h-[180px] w-[180px] items-center justify-center rounded-xl bg-white/5">
                    <QrCodeIcon className="h-16 w-16 text-gray-600" />
                  </div>
                )}
                <p className="flex items-center gap-1 text-[11px] text-gray-500">
                  <SmartphoneIcon className="h-3 w-3" />
                  Abra o app do seu banco e escaneie
                </p>
              </div>

              {/* Beneficiário */}
              <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">
                  Favorecido
                </p>
                <p className="text-sm font-semibold text-white">
                  {pixSettings.pixBeneficiary}
                </p>
              </div>

              {/* Ações */}
              <Button
                variant="outline"
                className="w-full gap-2 border-[#2C78B2]/50 text-[#2C78B2] hover:bg-[#2C78B2]/10"
                onClick={handleCopy}
                disabled={!pixCopiaECola}
              >
                <CopyIcon className="h-4 w-4" />
                Copiar Pix Copia e Cola
              </Button>

              <Button
                className="w-full gap-2 bg-green-600 font-bold text-white hover:bg-green-700"
                onClick={handleConfirm}
                disabled={confirming}
              >
                {confirming ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2Icon className="h-4 w-4" />
                )}
                Já paguei — Notificar Barbeiro
              </Button>
            </>
          ) : (
            <div className="rounded-xl border border-yellow-500/10 bg-yellow-500/5 p-4 text-center">
              <p className="text-sm italic text-yellow-500/80">
                O administrador precisa cadastrar uma chave Pix no painel de
                configurações.
              </p>
            </div>
          )}

          {confirmed && (
            <Button
              variant="ghost"
              className="w-full text-gray-400 hover:text-white"
              onClick={onSuccess || onClose}
            >
              Fechar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PixCheckoutDialog
