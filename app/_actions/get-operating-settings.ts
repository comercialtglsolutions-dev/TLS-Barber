"use server"

import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"

export const getOperatingDays = async (barbershopId?: string) => {
  let finalBarbershopId = barbershopId

  if (!finalBarbershopId) {
    const supabase = createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (authUser) {
      const user = await db.user.findUnique({
        where: { id: authUser.id },
        select: { barbershopId: true },
      })
      finalBarbershopId = user?.barbershopId || undefined
    }
  }

  if (!finalBarbershopId) return []

  return await (db as any).operatingDay.findMany({
    where: { barbershopId: finalBarbershopId },
    orderBy: {
      dayOfWeek: "asc",
    },
  })
}

export const getOperatingExceptions = async (barbershopId?: string) => {
  let finalBarbershopId = barbershopId

  if (!finalBarbershopId) {
    const supabase = createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (authUser) {
      const user = await db.user.findUnique({
        where: { id: authUser.id },
        select: { barbershopId: true },
      })
      finalBarbershopId = user?.barbershopId || undefined
    }
  }

  if (!finalBarbershopId) return []

  return await (db as any).operatingException.findMany({
    where: { barbershopId: finalBarbershopId },
    orderBy: {
      date: "asc",
    },
  })
}
