"use server"

import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"

export const getConfirmedBookings = async () => {
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
        gte: new Date(),
      },
    },
    include: {
      service: true,
      combo: true,
      barbershop: {
        include: {
          settings: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  })
}
