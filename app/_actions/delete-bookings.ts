"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"

export const deleteBooking = async (bookingId: string) => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) throw new Error("Não autorizado")

  const user = await db.user.findUnique({ where: { id: authUser.id } })

  if (user?.role !== "ADMIN") {
    throw new Error("Apenas administradores podem excluir agendamentos.")
  }

  await db.booking.delete({
    where: {
      id: bookingId,
    },
  })

  revalidatePath("/bookings")
  revalidatePath("/admin")
}
