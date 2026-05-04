"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"

interface CreateBookingParams {
  serviceId: string
  date: Date
}

export const createBooking = async (params: CreateBookingParams) => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    throw new Error("Usuário não autenticado!")
  }

  const service = (await (db as any).service.findUnique({
    where: { id: params.serviceId },
    select: { barbershopId: true },
  })) as any

  if (!service) {
    throw new Error("Serviço não encontrado")
  }

  await (db as any).booking.create({
    data: {
      userId: authUser.id,
      serviceId: params.serviceId,
      date: params.date,
      barbershopId: service.barbershopId,
    },
  })

  revalidatePath("/barbershops/[id]")
}
