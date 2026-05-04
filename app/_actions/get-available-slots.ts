"use server"

import { db } from "../_lib/prisma"
import { startOfDay, endOfDay } from "date-fns"

interface GetAvailableSlotsProps {
  date: Date
  barbershopId: string
  barberId?: string
}

export const getAvailableSlots = async ({
  date,
  barbershopId,
}: GetAvailableSlotsProps) => {
  try {
    const dayOfWeek = date.getDay()
    const normalizedDate = startOfDay(date)

    // 1. Fetch all necessary data for this specific barbershop
    const [exception, bookings, operatingDays, settings, barbers] =
      await Promise.all([
        (db as any).operatingException.findUnique({
          where: {
            barbershopId_date: {
              barbershopId,
              date: normalizedDate,
            },
          },
        }),
        (db as any).booking.findMany({
          where: {
            barbershopId,
            date: { gte: startOfDay(date), lte: endOfDay(date) },
          },
          select: { date: true, barberId: true },
        }),
        (db as any).operatingDay.findMany({
          where: { barbershopId },
        }),
        (db as any).settings.findFirst({
          where: { barbershopId },
        }),
        (db as any).barber.findMany({
          where: { barbershopId },
        }),
      ])

    const standardDay = operatingDays.find(
      (d: any) => d.dayOfWeek === dayOfWeek,
    )

    let startTime = "09:00"
    let endTime = "19:00"
    let isOpen = true

    if (exception) {
      isOpen = exception.isOpen
      if (isOpen && exception.startTime && exception.endTime) {
        startTime = exception.startTime
        endTime = exception.endTime
      }
    } else if (standardDay) {
      isOpen = standardDay.isOpen
      if (isOpen) {
        startTime = standardDay.startTime
        endTime = standardDay.endTime
      }
    } else if (settings) {
      startTime = settings.startHour || "09:00"
      endTime = settings.endHour || "19:00"
    }

    if (!isOpen) return []

    // Generate slots
    const slots = []
    const [startH, startM] = startTime.split(":").map(Number)
    const [endH, endM] = endTime.split(":").map(Number)

    let currentMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    const barbersCount = barbers.length || 1 // Fallback para 1 caso não haja barbeiros cadastrados

    // Mapear quantos agendamentos existem para cada horário
    const bookingsByTime: Record<string, number> = {}
    bookings.forEach((b: any) => {
      const bDate = new Date(b.date)
      const timeStr = `${bDate.getHours().toString().padStart(2, "0")}:${bDate.getMinutes().toString().padStart(2, "0")}`
      bookingsByTime[timeStr] = (bookingsByTime[timeStr] || 0) + 1
    })

    while (currentMinutes < endMinutes) {
      const h = Math.floor(currentMinutes / 60)
      const m = currentMinutes % 60
      const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`

      // O horário está disponível se o número de agendamentos for menor que o número de barbeiros
      const currentBookings = bookingsByTime[timeStr] || 0
      if (currentBookings < barbersCount) {
        slots.push(timeStr)
      }

      currentMinutes += 30
    }

    return slots
  } catch (error) {
    console.error("Error in getAvailableSlots:", error)
    return []
  }
}
