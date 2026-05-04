"use server"

import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"
import { revalidatePath } from "next/cache"

interface UpsertBarberParams {
  id?: string
  name: string
  imageUrl?: string
  description?: string
}

export const upsertBarber = async (params: UpsertBarberParams) => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) throw new Error("Não autorizado")

  const user = await db.user.findUnique({ where: { id: authUser.id } })

  if (user?.role !== "ADMIN") {
    throw new Error("Não autorizado")
  }

  const barbershopId = user.barbershopId

  if (params.id) {
    await (db as any).barber.update({
      where: { id: params.id },
      data: {
        name: params.name,
        imageUrl: params.imageUrl,
        description: params.description,
      },
    })
  } else {
    await (db as any).barber.create({
      data: {
        name: params.name,
        imageUrl: params.imageUrl,
        description: params.description,
        barbershopId,
      },
    })
  }

  revalidatePath("/admin")
  revalidatePath("/dashboard")
}
