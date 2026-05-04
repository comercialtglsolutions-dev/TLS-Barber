"use server"

import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"

export const getNotifications = async () => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return { bookings: [], purchases: [], pendingPixPayments: [] }
  }

  const user = await db.user.findUnique({
    where: { id: authUser.id },
    select: { role: true, barbershopId: true },
  })

  if (user?.role !== "ADMIN" || !user.barbershopId) {
    return { bookings: [], purchases: [], pendingPixPayments: [] }
  }

  const barbershopId = user.barbershopId

  const [bookings, purchases, pendingPixPayments] = await Promise.all([
    (db as any).booking.findMany({
      where: { barbershopId },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        service: true,
        combo: true,
      },
    }),
    (db as any).purchase.findMany({
      where: { barbershopId },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        product: true,
      },
    }) as Promise<any[]>,
    (db as any).booking.findMany({
      where: {
        barbershopId,
        paymentStatus: "PENDING_VERIFICATION",
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        user: true,
        service: true,
        combo: true,
      },
    }),
  ])

  // Convert Decimals to Numbers to avoid hydration issues
  const sanitizedBookings = bookings.map((b: any) => ({
    ...b,
    service: b.service
      ? { ...b.service, price: Number(b.service.price) }
      : null,
    combo: b.combo ? { ...b.combo, price: Number(b.combo.price) } : null,
  }))

  const sanitizedPurchases = purchases.map((p) => ({
    ...p,
    product: { ...p.product, price: Number(p.product.price) },
  }))

  const sanitizedPendingPix = pendingPixPayments.map((b: any) => ({
    ...b,
    service: b.service
      ? { ...b.service, price: Number(b.service.price) }
      : null,
    combo: b.combo ? { ...b.combo, price: Number(b.combo.price) } : null,
  }))

  return {
    bookings: sanitizedBookings,
    purchases: sanitizedPurchases,
    pendingPixPayments: sanitizedPendingPix,
  }
}
