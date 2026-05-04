"use server"

import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"

export const getConcludedBookings = async () => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return []
  }

  return db.booking.findMany({
    where: {
      userId: authUser.id,
      date: {
        lt: new Date(),
      },
    },
    include: {
      service: true,
      barbershop: true,
    },
    orderBy: {
      date: "asc",
    },
  })
}
