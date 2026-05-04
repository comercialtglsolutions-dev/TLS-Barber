"use server"

import { db } from "../_lib/prisma"

export const getBarbers = async (barbershopId: string) => {
  return await (db as any).barber.findMany({
    where: { barbershopId },
    orderBy: { name: "asc" },
  })
}
