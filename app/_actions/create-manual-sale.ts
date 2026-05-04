"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"

interface CreateManualSaleParams {
  userId: string
  productId: string
  quantity: number
}

export const createManualSale = async (params: CreateManualSaleParams) => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) throw new Error("Não autorizado")

  const user = await db.user.findUnique({ where: { id: authUser.id } })

  if (user?.role !== "ADMIN") {
    throw new Error("Somente administradores podem realizar vendas manuais.")
  }

  const barbershopId = user.barbershopId

  if (!barbershopId) {
    throw new Error("Barbearia não vinculada")
  }

  const result = await (db as any).purchase.create({
    data: {
      userId: params.userId,
      productId: params.productId,
      quantity: params.quantity,
      paymentStatus: "SUCCEEDED",
      barbershopId,
    },
  })

  revalidatePath("/")
  revalidatePath("/admin")

  return result
}
