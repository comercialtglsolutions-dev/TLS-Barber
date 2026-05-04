"use server"

import { endOfDay, startOfDay } from "date-fns"
import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"

interface GetBookingsProps {
  serviceId: string
  date: Date
}

export const getBookings = async ({ date }: GetBookingsProps) => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return []

  const user = await db.user.findUnique({ where: { id: authUser.id } })
  const barbershopId = user?.barbershopId

  if (!barbershopId) return []

  return (db as any).booking.findMany({
    where: {
      barbershopId,
      date: {
        lte: endOfDay(date),
        gte: startOfDay(date),
      },
    },
  })
}
