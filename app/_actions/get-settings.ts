"use server"

import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"

export const getSettings = async () => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  const user = await db.user.findUnique({
    where: { id: authUser.id },
    select: { barbershopId: true },
  })

  const barbershopId = user?.barbershopId

  if (!barbershopId) return null

  const settings = await (db as any).settings.findFirst({
    where: { barbershopId },
  })
  return settings
}
