"use server"

import { db } from "@/app/_lib/prisma"
import { createMercadoPagoPayment } from "./create-mercadopago-payment"
import { createItauPayment } from "./create-itau-payment"

export async function createPayment(params: {
  itemId: string
  type: "SERVICE" | "PRODUCT"
  method: "pix" | "card"
  barbershopId?: string
  metadata?: any
}) {
  // 1. Determinar o BarbershopId do item
  let barbershopId = params.barbershopId || ""

  if (!barbershopId) {
    if (params.type === "SERVICE") {
      if (params.itemId.startsWith("combined_")) {
        const ids = params.itemId.replace("combined_", "").split("_")
        const service = await db.service.findFirst({
          where: { id: { in: ids } },
          select: { barbershopId: true },
        })
        barbershopId = service?.barbershopId || ""
      } else {
        const service = await db.service.findUnique({
          where: { id: params.itemId },
          select: { barbershopId: true },
        })
        if (service) {
          barbershopId = service.barbershopId
        } else {
          const combo = await db.combo.findUnique({
            where: { id: params.itemId },
            select: { barbershopId: true },
          })
          barbershopId = combo?.barbershopId || ""
        }
      }
    } else {
      const product = await db.product.findUnique({
        where: { id: params.itemId },
        select: { barbershopId: true },
      })
      barbershopId = product?.barbershopId || ""
    }
  }

  // 2. Encontrar o banco habilitado para ESTA barbearia
  const credential = await db.bankCredential.findFirst({
    where: {
      isEnabled: true,
      bank: { barbershopId: barbershopId },
    },
    include: { bank: true },
  })

  if (!credential) {
    throw new Error(
      "Esta barbearia ainda não configurou uma conta para receber pagamentos online.",
    )
  }

  const provider = credential.bank.provider

  if (provider === "MERCADO_PAGO") {
    return await createMercadoPagoPayment(params)
  }

  if (provider === "ITAU") {
    if (params.method === "card") {
      throw new Error(
        "Itaú suporta apenas pagamentos via Pix nesta integração.",
      )
    }
    return await createItauPayment({ ...params, method: "pix" })
  }

  throw new Error(`Integração para o banco ${provider} não disponível.`)
}
