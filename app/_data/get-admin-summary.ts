"use server"

import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"

export const getAdminSummary = async () => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    throw new Error("Não autorizado")
  }

  const user = await db.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true, barbershopId: true },
  })

  if (user?.role !== "ADMIN" || !user.barbershopId) {
    throw new Error("Não autorizado")
  }

  const barbershopId = user.barbershopId

  const [
    bookings,
    purchases,
    services,
    products,
    combos,
    users,
    settings,
    operatingDays,
    operatingExceptions,
    barbers,
  ] = await Promise.all([
    db.booking.findMany({
      where: { barbershopId },
      include: {
        user: true,
        service: true,
        combo: true,
      },
      orderBy: {
        date: "desc",
      },
    }),
    db.purchase.findMany({
      where: { barbershopId },
      include: {
        user: true,
        product: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    db.service.findMany({
      where: { barbershopId },
    }),
    db.product.findMany({
      where: { barbershopId },
    }),
    (db as any).combo.findMany({
      where: { barbershopId },
      include: {
        service1: true,
        service2: true,
      },
    }),
    db.user.findMany(),
    db.settings.findUnique({
      where: { barbershopId },
    }),
    db.operatingDay.findMany({
      where: { barbershopId },
    }),
    (db as any).operatingException.findMany({
      where: { barbershopId },
    }),
    (db as any).barber.findMany({
      where: { barbershopId },
    }),
  ])

  return {
    bookings,
    purchases,
    services,
    products,
    combos,
    users,
    settings,
    operatingDays,
    operatingExceptions,
    barbers,
  }
}
