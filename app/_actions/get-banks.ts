"use server"

import { db } from "@/app/_lib/prisma"
import { createClient } from "../_lib/supabase/server"

export const getBanks = async () => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return []

  const user = await db.user.findUnique({
    where: { id: authUser.id },
    select: { barbershopId: true },
  })

  const barbershopId = user?.barbershopId

  if (!barbershopId) return []

  return await (db as any).bank.findMany({
    where: { barbershopId },
    include: {
      credentials: {
        select: {
          id: true,
          isEnabled: true,
          environment: true,
          isDefault: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })
}
