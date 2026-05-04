"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"

interface CreatePurchaseParams {
  productId: string
  quantity: number
}

export const createPurchase = async (params: CreatePurchaseParams) => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    throw new Error("Usuário não autenticado!")
  }

  const product = (await db.product.findUnique({
    where: { id: params.productId },
    select: { barbershopId: true },
  })) as any

  if (!product) {
    throw new Error("Produto não encontrado!")
  }

  await db.purchase.create({
    data: {
      productId: params.productId,
      quantity: params.quantity,
      userId: authUser.id,
      barbershopId: product.barbershopId,
    } as any,
  })

  revalidatePath("/")
  revalidatePath("/admin")
}
