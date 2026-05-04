"use server"

import { db } from "../_lib/prisma"
import { revalidatePath } from "next/cache"
import { createClient } from "../_lib/supabase/server"
import { startOfDay } from "date-fns"

interface UpsertOperatingExceptionProps {
  id?: string
  date: Date
  startTime?: string
  endTime?: string
  isOpen: boolean
  description?: string
}

export const upsertOperatingException = async (
  props: UpsertOperatingExceptionProps,
) => {
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
  if (!barbershopId) throw new Error("Barbearia não vinculada")

  const normalizedDate = startOfDay(props.date)

  if (props.id) {
    await (db as any).operatingException.update({
      where: { id: props.id },
      data: {
        date: normalizedDate,
        startTime: props.startTime,
        endTime: props.endTime,
        isOpen: props.isOpen,
        description: props.description,
      },
    })
  } else {
    await (db as any).operatingException.create({
      data: {
        barbershopId,
        date: normalizedDate,
        startTime: props.startTime,
        endTime: props.endTime,
        isOpen: props.isOpen,
        description: props.description,
      },
    })
  }

  revalidatePath("/admin")
  revalidatePath("/")
}

export const deleteOperatingException = async (id: string) => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) throw new Error("Não autorizado")

  const user = await db.user.findUnique({ where: { id: authUser.id } })

  if (user?.role !== "ADMIN") {
    throw new Error("Acesso negado")
  }

  await (db as any).operatingException.delete({
    where: { id },
  })

  revalidatePath("/admin")
  revalidatePath("/")
}
