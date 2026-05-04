"use server"

import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"
import { revalidatePath } from "next/cache"

export const confirmPixPayment = async (params: {
  bookingId?: string
  itemId: string
  type: "SERVICE" | "PRODUCT"
  barbershopId: string
  metadata?: any
}) => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    throw new Error("Não autorizado")
  }

  const userId = authUser.id

  if (params.bookingId) {
    await (db as any).booking.update({
      where: { id: params.bookingId },
      data: {
        paymentStatus: "PENDING_VERIFICATION",
      },
    })
  } else {
    if (params.type === "SERVICE") {
      const service = await (db as any).service.findUnique({
        where: { id: params.itemId },
      })

      let serviceId = null
      let comboId = null

      if (service) {
        serviceId = params.itemId
      } else {
        const combo = await (db as any).combo.findUnique({
          where: { id: params.itemId },
        })
        if (combo) {
          comboId = params.itemId
        } else {
          throw new Error(
            "Serviço ou Combo não encontrado para este pagamento.",
          )
        }
      }

      await (db as any).booking.create({
        data: {
          barbershopId: params.barbershopId,
          userId: userId,
          serviceId: serviceId,
          comboId: comboId,
          barberId: params.metadata?.barberId || null,
          date: new Date(params.metadata?.date),
          paymentStatus: "PENDING_VERIFICATION",
        },
      })
    } else {
      await (db as any).purchase.create({
        data: {
          barbershopId: params.barbershopId,
          userId: userId,
          productId: params.itemId,
          quantity: params.metadata?.quantity || 1,
          paymentStatus: "PENDING_VERIFICATION",
        },
      })
    }
  }

  revalidatePath("/bookings")
  revalidatePath("/dashboard")

  return { success: true }
}
