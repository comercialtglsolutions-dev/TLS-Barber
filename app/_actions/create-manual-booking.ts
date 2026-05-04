"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"
import { setHours, setMinutes } from "date-fns"

interface CreateManualBookingParams {
  userId: string
  serviceId?: string
  comboId?: string
  date: Date
  hour: string
}

export const createManualBooking = async (
  params: CreateManualBookingParams,
) => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) throw new Error("Não autorizado")

  const user = await db.user.findUnique({ where: { id: authUser.id } })

  if (user?.role !== "ADMIN") {
    throw new Error(
      "Acesso negado. Apenas administradores podem criar agendamentos manuais.",
    )
  }

  const [hours, minutes] = params.hour.split(":").map(Number)
  const bookingDate = setHours(setMinutes(params.date, minutes), hours)

  const barbershopId = user.barbershopId

  if (!barbershopId) {
    throw new Error("Barbearia não vinculada")
  }

  // Verificar se já existe agendamento no mesmo horário
  const existingBooking = await (db as any).booking.findFirst({
    where: {
      date: bookingDate,
      barbershopId,
    },
  })

  if (existingBooking) {
    throw new Error("Já existe um agendamento para este horário.")
  }

  await (db as any).booking.create({
    data: {
      serviceId: params.serviceId,
      comboId: params.comboId,
      userId: params.userId,
      date: bookingDate,
      paymentStatus: "SUCCEEDED",
      barbershopId,
    },
  })

  revalidatePath("/admin")
}
