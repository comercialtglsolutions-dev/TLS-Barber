import { NextResponse } from "next/server"
import { createClient } from "@/app/_lib/supabase/server"
import { stripe } from "@/app/_lib/stripe"
import { db } from "@/app/_lib/prisma"
import { decrypt } from "@/app/_lib/encryption"

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { itemId, type, quantity = 1, metadata = {} } = await req.json()

    if (!itemId || !type) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    let name = ""
    let price = 0
    let description = ""

    // 1. Processar itens a serem comprados (Serviço vs Produto)
    if (type === "SERVICE") {
      if (itemId.startsWith("combined_")) {
        const ids = itemId.replace("combined_", "").split("_")
        const services = await db.service.findMany({
          where: {
            id: { in: ids },
          },
        })

        if (services.length === 0) {
          return NextResponse.json(
            { error: "Services not found" },
            { status: 404 },
          )
        }

        const orderedServices = ids
          .map((id: string) => services.find((s) => s.id === id))
          .filter(Boolean) as typeof services

        name = orderedServices.map((s) => s.name).join(" + ")
        price = orderedServices.reduce((acc, s) => acc + Number(s.price), 0)
        description = orderedServices.map((s) => s.description).join(" e ")
      } else {
        const service = await db.service.findUnique({ where: { id: itemId } })
        if (service) {
          name = service.name
          price = Number(service.price)
          description = service.description
        } else {
          const combo = await db.combo.findUnique({ where: { id: itemId } })
          if (!combo) {
            return NextResponse.json(
              { error: "Service or Combo not found" },
              { status: 404 },
            )
          }
          name = combo.name
          price = Number(combo.price)
          description = combo.description
        }
      }
    } else if (type === "PRODUCT") {
      const product = await db.product.findUnique({ where: { id: itemId } })
      if (!product)
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 },
        )
      name = product.name
      price = Number(product.price)
      description = product.description
    }

    const appUrl = (
      process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
    ).replace(/\/$/, "")

    // 2. BUSCAR O GATEWAY BANCÁRIO DEFINIDO NO PAINEL
    const activeCredential = await db.bankCredential.findFirst({
      include: { bank: true },
      orderBy: { createdAt: "desc" },
    })

    const gateway = activeCredential?.bank?.provider || "CUSTOM"

    if (gateway === "MERCADO_PAGO" && activeCredential) {
      return NextResponse.json({
        gateway,
        amount: Number(price),
        name,
        itemId,
        isMock: false,
        action: "OPEN_MODAL",
      })
    }

    if (gateway === "ASAAS" && activeCredential) {
      try {
        const apiKey = decrypt(activeCredential.clientSecret)
        const apiUrl =
          activeCredential.environment === "PRODUCTION"
            ? "https://api.asaas.com/v3"
            : "https://sandbox.asaas.com/api/v3"

        const response = await fetch(`${apiUrl}/paymentLinks`, {
          method: "POST",
          headers: {
            access_token: apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `Pagamento: ${name}`,
            description: description,
            value: price,
            billingType: "UNDEFINED",
            chargeType: "DETACHED",
            dueDateLimitDays: 1,
          }),
        })

        const result = await response.json()
        if (result.url) {
          return NextResponse.json({ url: result.url })
        }
      } catch (err) {
        console.error("Asaas Error:", err)
      }

      return NextResponse.json({
        url: `${appUrl}/checkout/${gateway}?amount=${price}&name=${encodeURIComponent(name)}`,
        isMock: true,
        gateway,
        amount: price,
        name,
      })
    }

    if (gateway !== "STRIPE") {
      return NextResponse.json({
        url: `${appUrl}/checkout/${gateway}?amount=${price}&name=${encodeURIComponent(name)}`,
        isMock: true,
        hasActiveBank: !!activeCredential,
        gateway,
        amount: price,
        name,
      })
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name,
              description,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: quantity,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/bookings`,
      cancel_url: `${appUrl}/`,
      metadata: {
        userId: authUser.id,
        itemId,
        type,
        quantity,
        ...metadata,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("[CRIACAO_PAGAMENTO_ERRO]", error)
    return NextResponse.json(
      {
        error:
          "Não foi possível conectar com o banco. O Gateway recusou as chaves ou dados.",
      },
      { status: 500 },
    )
  }
}
