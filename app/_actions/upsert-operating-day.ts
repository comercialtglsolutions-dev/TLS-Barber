"use server"

import { db } from "../_lib/prisma"
import { revalidatePath } from "next/cache"
import { createClient } from "../_lib/supabase/server"

interface UpsertOperatingDayProps {
  dayOfWeek: number
  startTime: string
  endTime: string
  isOpen: boolean
}

export const upsertOperatingDay = async (props: UpsertOperatingDayProps) => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) throw new Error("Não autorizado")

  const user = await db.user.findUnique({ where: { id: authUser.id } })

  if (user?.role !== "ADMIN") {
    throw new Error("Acesso negado")
  }

  const barbershopId = user.barbershopId

  if (!barbershopId) {
    throw new Error("Barbearia não vinculada ao usuário")
  }

  const result = await (db as any).operatingDay.upsert({
    where: {
      barbershopId_dayOfWeek: {
        barbershopId,
        dayOfWeek: props.dayOfWeek,
      },
    },
    update: { ...props, barbershopId },
    create: { ...props, barbershopId },
  })

  revalidatePath("/admin")
  revalidatePath("/")
  return result
}
