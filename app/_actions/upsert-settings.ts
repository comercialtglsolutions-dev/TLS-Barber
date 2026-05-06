"use server"

import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"
import { revalidatePath } from "next/cache"
import { settingsSchema, SettingsSchema } from "../admin/_schemas"

export const upsertSettings = async (data: SettingsSchema) => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) throw new Error("Acesso negado")

  const user = await db.user.findUnique({ where: { id: authUser.id } })

  if (user?.role !== "ADMIN") {
    throw new Error("Acesso negado")
  }

  const validatedData = settingsSchema.parse(data)
  let barbershopId = user.barbershopId

  // Se não tem barbearia vinculada, cria uma nova
  if (!barbershopId) {
    const slug = validatedData.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")

    const newBarbershop = await db.barbershop.create({
      data: {
        name: validatedData.name,
        slug: `${slug}-${Math.floor(Math.random() * 1000)}`, // Sufixo para evitar duplicidade
        users: {
          connect: { id: user.id },
        },
      },
    })
    barbershopId = newBarbershop.id
  }

  await db.settings.upsert({
    where: { barbershopId },
    update: {
      name: validatedData.name,
      address: validatedData.address,
      description: validatedData.description,
      imageUrl: validatedData.imageUrl,
      startHour: validatedData.startHour,
      endHour: validatedData.endHour,
      phones: validatedData.phones || [],
      trialDays: validatedData.trialDays || 15,
      instagramUrl: validatedData.instagramUrl || "",
      whatsappUrl: validatedData.whatsappUrl || "",
      // @ts-ignore
      pixKey: (data as any).pixKey || null,
      // @ts-ignore
      pixKeyType: (data as any).pixKeyType || null,
      // @ts-ignore
      pixBeneficiary: (data as any).pixBeneficiary || null,
    },
    create: {
      barbershopId,
      name: validatedData.name,
      address: validatedData.address,
      description: validatedData.description,
      imageUrl: validatedData.imageUrl,
      startHour: validatedData.startHour,
      endHour: validatedData.endHour,
      phones: validatedData.phones || [],
      trialDays: validatedData.trialDays || 15,
      instagramUrl: validatedData.instagramUrl || "",
      whatsappUrl: validatedData.whatsappUrl || "",
      // @ts-ignore
      pixKey: (data as any).pixKey || null,
      // @ts-ignore
      pixKeyType: (data as any).pixKeyType || null,
      // @ts-ignore
      pixBeneficiary: (data as any).pixBeneficiary || null,
    },
  })

  revalidatePath("/admin")
  revalidatePath("/")
}
