"use server"

import { createClient } from "../_lib/supabase/server"
import { stripe } from "../_lib/stripe"
import { db } from "../_lib/prisma"

export const createCustomerPortal = async () => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    throw new Error("Não autorizado")
  }

  const userId = authUser.id

  // Buscar o usuário no banco usando query bruta para pular a validação do Prisma Client
  const users: any[] = await db.$queryRawUnsafe(
    `SELECT "stripeCustomerId", "email", "role" FROM "User" WHERE "id" = $1`,
    userId,
  )
  const user = users[0]

  if (user?.role !== "ADMIN") {
    throw new Error("Não autorizado")
  }

  let customerId = user?.stripeCustomerId

  // Se não tiver stripeCustomerId, tentamos buscar no Stripe pelo email
  if (!customerId) {
    const customers = await stripe.customers.list({
      email: user?.email,
      limit: 1,
    })

    if (customers.data.length > 0) {
      customerId = customers.data[0].id

      // Atualizar o banco usando query bruta
      await db.$executeRawUnsafe(
        `UPDATE "User" SET "stripeCustomerId" = $1 WHERE "id" = $2`,
        customerId,
        userId,
      )
    } else {
      throw new Error(
        "Você ainda não possui uma assinatura ativa ou cliente vinculado no Stripe.",
      )
    }
  }

  // Criar a sessão do portal
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/admin`,
  })

  return { url: portalSession.url }
}
