"use server"

import { db } from "@/app/_lib/prisma"
import { productSchema } from "../admin/_schemas"
import { revalidatePath } from "next/cache"
import { createClient } from "../_lib/supabase/server"
import { getPlanLimits } from "../_lib/subscription-limits"

export const upsertProduct = async (params: {
  id?: string
  name: string
  description: string
  imageUrl: string
  price: number
}) => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) throw new Error("Não autorizado")

  const user = await db.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      role: true,
      barbershopId: true,
      subscriptionPlan: true,
    },
  })

  if (user?.role !== "ADMIN") {
    throw new Error("Não autorizado")
  }

  const { id, name, description, imageUrl, price } = productSchema.parse(params)
  const barbershopId = user.barbershopId

  if (!barbershopId) {
    throw new Error("Barbearia não encontrada")
  }

  // VERIFICAÇÃO DE LIMITES DO PLANO
  if (!id) {
    const count = await db.product.count({
      where: { barbershopId },
    })

    const limits = getPlanLimits(user?.subscriptionPlan as any)

    if (count >= limits.maxProducts) {
      throw new Error(
        `Você atingiu o limite de ${limits.maxProducts} produtos do seu plano.`,
      )
    }
  }

  let result
  if (id) {
    result = await (db as any).product.update({
      where: { id, barbershopId },
      data: { name, description, imageUrl, price },
    })
  } else {
    result = await (db as any).product.create({
      data: { name, description, imageUrl, price, barbershopId },
    })
  }

  revalidatePath("/admin")
  revalidatePath("/products")
  revalidatePath("/")
  return { ...result, price: Number(result.price) }
}
