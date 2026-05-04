"use server"

import { db } from "@/app/_lib/prisma"
import { comboSchema } from "../admin/_schemas"
import { revalidatePath } from "next/cache"
import { createClient } from "../_lib/supabase/server"
import { getPlanLimits } from "../_lib/subscription-limits"

export const upsertCombo = async (params: {
  id?: string
  name: string
  description: string
  imageUrl: string
  price?: number
  service1Id: string
  service2Id: string
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

  const { id, name, description, imageUrl, price, service1Id, service2Id } =
    comboSchema.parse(params)

  let finalPrice = price

  if (!finalPrice || finalPrice <= 0) {
    const [service1, service2] = await Promise.all([
      db.service.findUnique({ where: { id: service1Id } }),
      db.service.findUnique({ where: { id: service2Id } }),
    ])

    if (!service1 || !service2) {
      throw new Error("Serviços não encontrados")
    }

    finalPrice = Number(service1.price) + Number(service2.price)
  }

  const barbershopId = user.barbershopId

  if (!barbershopId) {
    throw new Error("Barbearia não encontrada")
  }

  if (!id) {
    const count = await db.combo.count({
      where: { barbershopId },
    })

    const limits = getPlanLimits(user?.subscriptionPlan as any)

    if (count >= limits.maxCombos) {
      throw new Error(
        `Você atingiu o limite de ${limits.maxCombos} combos do seu plano.`,
      )
    }
  }

  let result
  if (id) {
    result = await (db as any).combo.update({
      where: { id },
      data: {
        name,
        description,
        imageUrl,
        price: finalPrice,
        service1Id,
        service2Id,
        barbershopId,
      },
    })
  } else {
    result = await (db as any).combo.create({
      data: {
        name,
        description,
        imageUrl,
        price: finalPrice,
        service1Id,
        service2Id,
        barbershopId,
      },
    })
  }

  revalidatePath("/admin")
  revalidatePath("/")
  return result
}
