"use server"

import { db } from "../_lib/prisma"

interface GetAvailableBarbersProps {
  date: Date
  barbershopId: string
}

export const getAvailableBarbers = async ({
  date,
  barbershopId,
}: GetAvailableBarbersProps) => {
  // 1. Fetch all barbers for this barbershop
  const barbers = await (db as any).barber.findMany({
    where: { barbershopId },
  })

  // 2. Fetch all bookings for this specific date and time
  const bookings = await (db as any).booking.findMany({
    where: {
      barbershopId,
      date: date, // Exact match for the selected date and hour
    },
    select: { barberId: true },
  })

  const bookedBarberIds = new Set(bookings.map((b: any) => b.barberId))

  // 3. Filter barbers who are NOT in the bookedBarberIds
  const availableBarbers = barbers.filter(
    (barber: any) => !bookedBarberIds.has(barber.id),
  )

  return availableBarbers
}
