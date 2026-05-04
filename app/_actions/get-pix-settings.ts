"use server"

import { db } from "../_lib/prisma"

export const getPixSettings = async (barbershopId: string) => {
  try {
    const settings = await (db as any).settings.findUnique({
      where: { barbershopId },
      select: {
        pixKey: true,
        pixKeyType: true,
        pixBeneficiary: true,
      },
    })

    return {
      pixKey: settings?.pixKey || null,
      pixKeyType: settings?.pixKeyType || null,
      pixBeneficiary: settings?.pixBeneficiary || null,
    }
  } catch (error) {
    console.error("Erro ao buscar configurações de Pix:", error)
    return {
      pixKey: null,
      pixKeyType: null,
      pixBeneficiary: null,
    }
  }
}
