"use server"

import { db } from "@/app/_lib/prisma"
import { revalidatePath } from "next/cache"
import { createClient } from "../_lib/supabase/server"

export const deleteProduct = async (id: string) => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) throw new Error("Não autorizado")

  const user = await db.user.findUnique({ where: { id: authUser.id } })

  if (user?.role !== "ADMIN") {
    throw new Error("Não autorizado")
  }

  await db.product.delete({
    where: { id },
  })

  revalidatePath("/admin")
  revalidatePath("/products")
  revalidatePath("/")
}
