"use server"

import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"
import { stripe } from "../_lib/stripe"

export const getSubscriptionData = async () => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  const userId = authUser.id

  // Usar query bruta para evitar erros de validação do Prisma Client
  const users: any[] = await db.$queryRawUnsafe(
    `SELECT "subscriptionPlan", "stripeCustomerId", "email" FROM "User" WHERE "id" = $1`,
    userId,
  )

  const user = users[0]
  if (!user) return null

  let stripeDetails = null
  let customerId = user.stripeCustomerId

  // Se não tiver o ID no banco, tenta buscar no Stripe pelo e-mail
  if (!customerId && user.email) {
    try {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })

      if (customers.data.length > 0) {
        customerId = customers.data[0].id
        // Salva no banco para não ter que buscar de novo
        await db.$executeRawUnsafe(
          `UPDATE "User" SET "stripeCustomerId" = $1 WHERE "id" = $2`,
          customerId,
          userId,
        )
      }
    } catch (e) {
      console.error("Erro ao buscar cliente por email:", e)
    }
  }

  if (customerId) {
    try {
      // Busca todas as assinaturas do cliente para verificar status (incluindo trialing)
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "all", // Buscamos todas e filtramos no código para ser mais flexível
        expand: ["data.default_payment_method"],
        limit: 1,
      })

      console.log(
        `[Stripe] Encontradas ${subscriptions.data.length} assinaturas para o cliente ${customerId}`,
      )

      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0] as any

        // Só processamos se for ativa ou trialing
        if (sub.status === "active" || sub.status === "trialing") {
          const paymentMethod = sub.default_payment_method as any
          const priceId = sub.items.data[0].price.id

          // Mapeamento de planos (igual ao webhook)
          const planMapping: Record<string, string> = {
            [(process.env.STRIPE_BARBER_PRICE_ID || "").trim()]: "BARBER",
            [(process.env.STRIPE_PREMIUM_PRICE_ID || "").trim()]: "PREMIUM",
          }

          const activePlan = planMapping[priceId]

          // Se o plano no banco estiver desatualizado, sincroniza agora!
          if (activePlan && activePlan !== user.subscriptionPlan) {
            await db.$executeRawUnsafe(
              `UPDATE "User" SET "subscriptionPlan" = $1::"SubscriptionPlan" WHERE "id" = $2`,
              activePlan,
              userId,
            )
            user.subscriptionPlan = activePlan
          }

          // LÓGICA DE DATA:
          // 1. Prioridade: current_period_end (fim do ciclo atual)
          // 2. Se estiver em trial: trial_end
          let nextInvoiceTimestamp = sub.current_period_end * 1000

          if (sub.trial_end && sub.trial_end * 1000 > Date.now()) {
            nextInvoiceTimestamp = sub.trial_end * 1000
          }

          stripeDetails = {
            currentPeriodEnd: nextInvoiceTimestamp,
            currentPeriodStart: sub.current_period_start * 1000,
            amount: sub.items.data[0].plan.amount! / 100,
            cardBrand: paymentMethod?.card?.brand || "CARTÃO",
            cardLast4: paymentMethod?.card?.last4 || "****",
            planName: activePlan || "ATIVO",
            status: sub.status,
          }
        } else {
          console.log(
            `[Stripe] Assinatura encontrada mas com status: ${sub.status}`,
          )
        }
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes no Stripe:", error)
    }
  }

  return {
    ...user,
    details: stripeDetails,
  }
}
