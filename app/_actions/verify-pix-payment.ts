"use server"

import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"
import { revalidatePath } from "next/cache"

export const verifyPixPayment = async (
  bookingId: string,
  action: "CONFIRM" | "REJECT",
) => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) throw new Error("Não autorizado")

  const user = await db.user.findUnique({ where: { id: authUser.id } })

  if (user?.role !== "ADMIN") {
    throw new Error("Acesso negado")
  }

  const newStatus = action === "CONFIRM" ? "SUCCEEDED" : "FAILED"

  await (db as any).booking.update({
    where: { id: bookingId },
    data: {
      paymentStatus: newStatus,
    },
  })

  revalidatePath("/dashboard")
  revalidatePath("/admin")
  revalidatePath("/bookings")

  return { success: true, status: newStatus }
}
