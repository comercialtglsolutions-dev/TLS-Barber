import { stripe } from "../app/_lib/stripe"
import dotenv from "dotenv"
dotenv.config()

async function testStripePrices() {
  const barberPriceId = process.env.STRIPE_BARBER_PRICE_ID
  const premiumPriceId = process.env.STRIPE_PREMIUM_PRICE_ID

  console.log("Barber Price ID:", barberPriceId)
  console.log("Premium Price ID:", premiumPriceId)

  if (!barberPriceId || !premiumPriceId) {
    console.error("Price IDs not found in .env")
    return
  }

  try {
    const barberPrice = await stripe.prices.retrieve(barberPriceId)
    const premiumPrice = await stripe.prices.retrieve(premiumPriceId)

    console.log("Barber Price Object:", JSON.stringify(barberPrice, null, 2))
    console.log("Premium Price Object:", JSON.stringify(premiumPrice, null, 2))

    console.log("Barber Amount:", (barberPrice.unit_amount || 0) / 100)
    console.log("Premium Amount:", (premiumPrice.unit_amount || 0) / 100)
  } catch (error) {
    console.error("Error retrieving prices:", error)
  }
}

testStripePrices()
