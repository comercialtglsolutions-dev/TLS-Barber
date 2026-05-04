"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet"
import { Button } from "./ui/button"
import { useState } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { useAuth } from "../_providers/auth"
import { MinusIcon, PlusIcon } from "lucide-react"
import SignInDialog from "./sign-in-dialog"
import { Dialog, DialogContent } from "./ui/dialog"
import PaymentCheckoutDialog from "./payment-checkout-dialog"

interface ProductPurchaseSheetProps {
  product: {
    id: string
    name: string
    description: string
    imageUrl: string
    price: number
    barbershopId: string
  }
  isOpen: boolean
  onClose: () => void
}

const ProductPurchaseSheet = ({
  product,
  isOpen,
  onClose,
}: ProductPurchaseSheetProps) => {
  const { user } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [isSignInDialogOpen, setIsSignInDialogOpen] = useState(false)

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentData, setPaymentData] = useState<{
    amount: number
    serviceName: string
    itemId: string
    type: "SERVICE" | "PRODUCT"
    barbershopId: string
  } | null>(null)

  const handleIncreaseQuantity = () => setQuantity((prev) => prev + 1)
  const handleDecreaseQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1))

  const handlePurchase = async () => {
    if (!user) {
      setIsSignInDialogOpen(true)
      return
    }

    try {
      setLoading(true)

      const response = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          itemId: product.id,
          type: "PRODUCT",
          quantity: quantity,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao iniciar checkout")
      }

      const checkoutResponse = await response.json()

      // Se for Mercado Pago ou Mock, abrimos nosso modal profissional
      if (checkoutResponse.action === "OPEN_MODAL" || checkoutResponse.isMock) {
        setPaymentData({
          amount: Number(checkoutResponse.amount * quantity),
          serviceName: checkoutResponse.name,
          itemId: product.id,
          type: "PRODUCT",
          barbershopId: product.barbershopId,
        })
        setIsPaymentModalOpen(true)
        return
      }

      if (checkoutResponse.url) {
        window.location.href = checkoutResponse.url
      }
    } catch (error) {
      console.error("Error initiating checkout:", error)
      toast.error("Erro ao realizar compra. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[90%] border-l border-white/10 bg-[#121212] sm:w-[400px]">
          <SheetHeader className="border-b border-solid border-secondary px-5 py-6 text-left">
            <SheetTitle className="text-left text-white">
              Comprar {product.name}
            </SheetTitle>
            <SheetDescription className="text-gray-400">
              Defina a quantidade e finalize sua compra com segurança.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-6 py-6">
            <div className="relative h-[200px] w-full">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="rounded-xl object-cover"
              />
            </div>

            <div>
              <h3 className="text-lg font-bold leading-none text-white">
                {product.name}
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                {product.description}
              </p>
            </div>

            <div className="flex items-center justify-between border-y border-white/5 py-4">
              <span className="font-medium text-white">Quantidade</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-white/10 text-white"
                  onClick={handleDecreaseQuantity}
                >
                  <MinusIcon className="h-4 w-4" />
                </Button>
                <span className="w-4 text-center font-bold text-white">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-white/10 text-white"
                  onClick={handleIncreaseQuantity}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total</span>
              <span className="text-xl font-bold text-[#3EABFD]">
                R$ {(product.price * quantity).toFixed(2)}
              </span>
            </div>

            <Button
              className="w-full rounded-xl bg-[#3EABFD] py-6 font-bold text-white transition-all hover:bg-[#102332]"
              onClick={handlePurchase}
              disabled={loading}
            >
              {loading ? "Processando..." : "Confirmar Compra"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isSignInDialogOpen} onOpenChange={setIsSignInDialogOpen}>
        <DialogContent className="w-[90%] rounded-2xl border border-white/10 bg-[#1A1A1A] p-6 shadow-2xl">
          <SignInDialog />
        </DialogContent>
      </Dialog>

      <PaymentCheckoutDialog
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={paymentData?.amount || 0}
        serviceName={paymentData?.serviceName || ""}
        itemId={paymentData?.itemId || ""}
        type={paymentData?.type || "PRODUCT"}
        barbershopId={paymentData?.barbershopId || product.barbershopId}
      />
    </>
  )
}

export default ProductPurchaseSheet
