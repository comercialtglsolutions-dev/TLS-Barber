"use server"

import { createClient } from "../_lib/supabase/server"
import { stripe } from "../_lib/stripe"

export const createStripeCheckout = async (priceId: string) => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    throw new Error("Você precisa estar logado para realizar uma assinatura.")
  }

  const userId = authUser.id
  const userEmail = authUser.email

  // Cria a sessão de checkout no Stripe
  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_URL}/admin/subscription?status=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/?status=canceled`,
    customer_email: userEmail!,
    metadata: {
      userId,
      priceId,
    },
  })

  return { sessionId: checkoutSession.id, url: checkoutSession.url }
}
