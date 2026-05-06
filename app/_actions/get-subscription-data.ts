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
    `SELECT "subscriptionPlan", "stripeCustomerId", "email", "trialEndsAt", "hasUsedTrial", "cardLast4", "cardBrand", "nextInvoiceDate", "planStartedAt" FROM "User" WHERE "id" = $1`,
    userId,
  )

  const user = users[0]
  if (!user) return null

  // Se o usuário nunca usou o teste e o trialEndsAt está nulo, inicializa agora!
  if (!user.trialEndsAt) {
    const trialDays = 15
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)

    await db.$executeRawUnsafe(
      `UPDATE "User" SET "trialEndsAt" = $1, "hasUsedTrial" = true WHERE "id" = $2`,
      trialEndsAt,
      userId,
    )
    user.trialEndsAt = trialEndsAt
  }

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

  // Se for plano FREE, verificamos se está em período de teste
  if (user.subscriptionPlan === "FREE") {
    const now = new Date()
    const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null

    if (trialEndsAt && trialEndsAt > now) {
      stripeDetails = {
        currentPeriodEnd: trialEndsAt.getTime(),
        currentPeriodStart: now.getTime(),
        amount: 0,
        cardBrand: null,
        cardLast4: null,
        planName: "TESTE",
        status: "trialing",
      }
    }
  }

  // Se for plano pago ou se já tivermos customerId, buscamos no Stripe para atualização/detalhes
  if (customerId && user.subscriptionPlan !== "FREE") {
    try {
      // Busca assinaturas com status variado para ser mais resiliente
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        expand: ["data.default_payment_method"],
        limit: 5,
      })

      // Filtra pela assinatura que realmente importa (ativa ou trialing com plano pago)
      const sub = subscriptions.data.find(
        (s) => s.status === "active" || s.status === "trialing",
      ) as any

      if (sub) {
        let paymentMethod = sub.default_payment_method as any

        // Se a assinatura não tem método padrão, busca no cliente
        if (!paymentMethod) {
          const customer = (await stripe.customers.retrieve(customerId, {
            expand: ["invoice_settings.default_payment_method"],
          })) as any
          paymentMethod = customer.invoice_settings?.default_payment_method
        }

        stripeDetails = {
          currentPeriodEnd: sub.current_period_end * 1000,
          currentPeriodStart: sub.current_period_start * 1000,
          amount: sub.items.data[0].plan.amount! / 100,
          cardBrand:
            paymentMethod?.card?.brand?.toUpperCase() || user.cardBrand || null,
          cardLast4: paymentMethod?.card?.last4 || user.cardLast4 || null,
          planName: user.subscriptionPlan,
          status: sub.status,
        }

        // Sincroniza dados de faturamento no banco para persistência local
        if (
          paymentMethod?.card?.last4 &&
          (paymentMethod.card.last4 !== user.cardLast4 ||
            !user.nextInvoiceDate ||
            sub.current_period_end * 1000 !==
              (user.nextInvoiceDate
                ? new Date(user.nextInvoiceDate).getTime()
                : 0))
        ) {
          await db.$executeRawUnsafe(
            `UPDATE "User" SET "cardLast4" = $1, "cardBrand" = $2, "nextInvoiceDate" = $3 WHERE "id" = $4`,
            paymentMethod.card.last4,
            paymentMethod.card.brand.toUpperCase(),
            new Date(sub.current_period_end * 1000),
            userId,
          )
        }
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes no Stripe:", error)
    }
  }

  // SALVAGUARDA FINAL: Se for plano pago e não temos detalhes do Stripe ou data no banco
  if (user.subscriptionPlan !== "FREE") {
    let planStart = user.planStartedAt ? new Date(user.planStartedAt) : null

    // Se não tem data de início, define como AGORA
    if (!planStart) {
      planStart = new Date()
      await db.$executeRawUnsafe(
        `UPDATE "User" SET "planStartedAt" = $1 WHERE "id" = $2`,
        planStart,
        userId,
      )
    }

    // Calcula 30 dias após o início
    const fallbackNextInvoice = new Date(planStart)
    fallbackNextInvoice.setDate(fallbackNextInvoice.getDate() + 30)

    // Se stripeDetails não existe ou não tem data, forçamos o preenchimento
    if (!stripeDetails || !stripeDetails.currentPeriodEnd) {
      stripeDetails = {
        ...(stripeDetails || {}),
        currentPeriodEnd: user.nextInvoiceDate
          ? new Date(user.nextInvoiceDate).getTime()
          : fallbackNextInvoice.getTime(),
        currentPeriodStart: planStart.getTime(),
        amount:
          stripeDetails?.amount ||
          (user.subscriptionPlan === "PREMIUM" ? 109.99 : 89.99),
        cardBrand: stripeDetails?.cardBrand || user.cardBrand || null,
        cardLast4: stripeDetails?.cardLast4 || user.cardLast4 || null,
        planName: user.subscriptionPlan,
        status: stripeDetails?.status || "active",
      } as any
    }

    // Se ainda não tinha data de próxima fatura no banco, salva a calculada
    if (!user.nextInvoiceDate) {
      await db.$executeRawUnsafe(
        `UPDATE "User" SET "nextInvoiceDate" = $1 WHERE "id" = $2`,
        fallbackNextInvoice,
        userId,
      )
    }
  }

  // Debug via arquivo para eu conseguir ver o que está acontecendo
  try {
    const fs = require("fs")
    const logData = `
--- DEBUG SUBSCRIPTION [${new Date().toISOString()}] ---
User: ${user.email}
Plan: ${user.subscriptionPlan}
DB nextInvoiceDate: ${user.nextInvoiceDate}
DB planStartedAt: ${user.planStartedAt}
StripeDetails Amount: ${stripeDetails?.amount}
StripeDetails Date: ${stripeDetails?.currentPeriodEnd} (${stripeDetails?.currentPeriodEnd ? new Date(stripeDetails.currentPeriodEnd).toLocaleDateString() : "NULL"})
-------------------------------------------------------
`
    fs.appendFileSync("debug_subscription.log", logData)
  } catch (e) {
    // Ignora erro de escrita de log
  }

  return {
    ...user,
    details: stripeDetails,
  }
}
