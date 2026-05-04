"use client"

import { Card, CardContent } from "./ui/card"
import Image from "next/image"
import { Button } from "./ui/button"
import { useState } from "react"
import ProductPurchaseSheet from "./product-purchase-sheet"
import ItemDetailsDialog from "./item-details-dialog"

interface ProductItemProps {
  product: {
    id: string
    name: string
    description: string
    imageUrl: string
    price: number
    barbershopId: string
  }
}

const ProductItem = ({ product }: ProductItemProps) => {
  const [isPurchaseSheetOpen, setIsPurchaseSheetOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  const handlePurchaseClick = () => {
    setIsPurchaseSheetOpen(true)
  }

  return (
    <>
      <Card
        className="min-w-[167px] flex-shrink-0 cursor-pointer rounded-2xl transition-all hover:border-[#3EABFD]/50 lg:w-[185px]"
        onClick={() => setIsDetailsDialogOpen(true)}
      >
        <CardContent className="p-0 px-1 pt-1">
          {/* IMAGEM */}
          <div className="relative h-[159px] w-full">
            <Image
              alt={product.name}
              fill
              sizes="(max-width: 768px) 167px, 185px"
              className="rounded-2xl object-cover"
              src={product.imageUrl}
            />
          </div>

          {/* TEXTO */}
          <div className="px-1 py-3">
            <h3 className="truncate text-sm font-semibold text-white">
              {product.name}
            </h3>
            <p className="truncate text-xs text-gray-400">
              {product.description}
            </p>
            <p className="text-xs font-bold" style={{ color: "#3EABFD" }}>
              R$ {Number(product.price).toFixed(2)}
            </p>
            <Button
              variant="secondary"
              className="mt-3 w-full rounded-xl bg-[#102332] hover:bg-[#3EABFD]"
              onClick={(e) => {
                e.stopPropagation()
                handlePurchaseClick()
              }}
            >
              <span className="text-xs text-white">Comprar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <ItemDetailsDialog
        item={{
          ...product,
          type: "product",
        }}
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        onAction={handlePurchaseClick}
      />

      <ProductPurchaseSheet
        product={product}
        isOpen={isPurchaseSheetOpen}
        onClose={() => setIsPurchaseSheetOpen(false)}
      />
    </>
  )
}

export default ProductItem
