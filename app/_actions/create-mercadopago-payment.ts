"use server"

import { db } from "@/app/_lib/prisma"
import { decrypt } from "@/app/_lib/encryption"
import { createClient } from "@/app/_lib/supabase/server"
import crypto from "crypto"

export async function createMercadoPagoPayment(params: {
  itemId: string
  type: "SERVICE" | "PRODUCT"
  method: "pix" | "card"
  metadata?: any
}) {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) throw new Error("Não autorizado")

  // 1. Get Item Data
  let title = ""
  let price = 0
  let barbershopId = ""

  if (params.type === "SERVICE") {
    if (params.itemId.startsWith("combined_")) {
      const ids = params.itemId.replace("combined_", "").split("_")
      const services = await db.service.findMany({ where: { id: { in: ids } } })
      const orderedServices = ids
        .map((id) => services.find((s) => s.id === id))
        .filter(Boolean) as any[]

      title = orderedServices.map((s) => s.name).join(" + ")
      price = orderedServices.reduce((acc, s) => acc + Number(s.price), 0)
      barbershopId = orderedServices[0]?.barbershopId || ""
    } else {
      const service = (await db.service.findUnique({
        where: { id: params.itemId },
      })) as any
      if (service) {
        title = service.name
        price = Number(service.price)
        barbershopId = service.barbershopId
      } else {
        const combo = (await db.combo.findUnique({
          where: { id: params.itemId },
        })) as any
        if (!combo) throw new Error("Serviço ou Combo não encontrado.")
        title = combo.name
        price = Number(combo.price)
        barbershopId = combo.barbershopId
      }
    }
  } else {
    const product = (await db.product.findUnique({
      where: { id: params.itemId },
    })) as any
    if (!product) throw new Error("Produto não encontrado")
    title = product.name
    price = Number(product.price)
    barbershopId = product.barbershopId
  }

  // 2. Get Credentials
  const credential = (await db.bankCredential.findFirst({
    where: {
      bank: { provider: "MERCADO_PAGO", barbershopId: barbershopId },
    },
    include: { bank: true },
  })) as any

  if (!credential || !credential.isEnabled) {
    throw new Error("Integração com Mercado Pago não cadastrada ou desativada.")
  }

  const accessToken = decrypt(credential.clientSecret)

  if (accessToken.includes(":")) {
    throw new Error(
      "Suas credenciais do Mercado Pago estão ilegíveis (Erro de Chave). Por favor, vá ao Painel Admin e salve novamente seu Access Token.",
    )
  }

  let appUrl = (process.env.NEXT_PUBLIC_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  )

  const isLocal = appUrl.includes("localhost")
  const notificationUrl = isLocal
    ? undefined
    : `${appUrl}/api/webhooks/mercadopago`

  const externalReference = `${authUser.id}_${params.itemId}_${Date.now()}`

  // 3. Create Payment based on method
  if (params.method === "pix") {
    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: price,
        description: `Agendamento: ${title}`,
        payment_method_id: "pix",
        payer: {
          email: authUser.email,
          first_name:
            authUser.user_metadata?.full_name?.split(" ")[0] || "Cliente",
          last_name:
            authUser.user_metadata?.full_name?.split(" ").slice(1).join(" ") ||
            "TGL",
        },
        external_reference: externalReference,
        metadata: {
          user_id: authUser.id,
          item_id: params.itemId,
          type: params.type,
          barbershop_id: barbershopId,
          date: params.metadata?.date,
          ...params.metadata,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[MP PIX Error]:", data)
      if (data.message?.includes("Collector user without key enabled")) {
        throw new Error(
          "Sua conta do Mercado Pago não possui uma Chave PIX cadastrada. Por favor, cadastre uma chave (E-mail, CPF ou Aleatória) no Mercado Pago para aceitar PIX.",
        )
      }
      throw new Error(data.message || "Erro ao gerar PIX")
    }

    return {
      id: data.id,
      qrCode: data.point_of_interaction.transaction_data.qr_code,
      qrCodeBase64: data.point_of_interaction.transaction_data.qr_code_base64,
      amount: price,
      method: "pix",
    }
  } else {
    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            { title, quantity: 1, currency_id: "BRL", unit_price: price },
          ],
          metadata: {
            user_id: authUser.id,
            item_id: params.itemId,
            type: params.type,
            barbershop_id: barbershopId,
            date: params.metadata?.date,
            ...params.metadata,
          },
          back_urls: {
            success: `${appUrl}/bookings`,
            failure: `${appUrl}/`,
            pending: `${appUrl}/bookings`,
          },
          auto_return: "approved",
          external_reference: externalReference,
          ...(notificationUrl && { notification_url: notificationUrl }),
        }),
      },
    )

    const data = await response.json()
    if (!response.ok) {
      console.error("[MP Preference Error]:", data)
      throw new Error("Erro ao gerar link de cartão")
    }

    return {
      id: data.id,
      url: data.init_point,
      method: "card",
    }
  }
}
