"use server"

import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"
import { revalidatePath } from "next/cache"

export const getOnboardingStatus = async () => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    console.log("[Onboarding] Sem sessão ativa")
    return { isCompleted: true }
  }

  const userId = authUser.id
  const user = await (db as any).user.findUnique({
    where: { id: userId },
    include: { barbershop: true },
  })

  console.log(
    `[Onboarding] Usuário: ${user?.email}, Role: ${user?.role}, Barbearia: ${user?.barbershopId}`,
  )

  // Somente ADMINS (barbeiros) passam pelo onboarding
  if (user?.role !== "ADMIN") {
    console.log("[Onboarding] Usuário não é ADMIN, pulando...")
    return { isCompleted: true }
  }

  const isCompleted = (user as any).barbershop?.onboardingCompleted || false

  let currentStep = 1
  let existingData: any = {}

  if (!isCompleted && (user as any).barbershopId) {
    const barbershopId = (user as any).barbershopId

    const [settings, operatingDays, barbers, services, products, combos] =
      await Promise.all([
        (db as any).settings.findUnique({ where: { barbershopId } }),
        (db as any).operatingDay.findMany({ where: { barbershopId } }),
        (db as any).barber.findMany({ where: { barbershopId } }),
        (db as any).service.findMany({ where: { barbershopId } }),
        (db as any).product.findMany({ where: { barbershopId } }),
        (db as any).combo.findMany({ where: { barbershopId } }),
      ])

    existingData = {
      settings,
      operatingDays,
      barbers,
      services: services.map((s: any) => ({ ...s, price: Number(s.price) })),
      products: products.map((p: any) => ({ ...p, price: Number(p.price) })),
      combos: combos.map((c: any) => ({ ...c, price: Number(c.price) })),
    }

    if (settings) {
      currentStep = 2
      if (operatingDays.length > 0) {
        currentStep = 3
        if (barbers.length > 0) {
          currentStep = 4
          if (services.length > 0) {
            currentStep = 5
            if (products.length > 0) {
              currentStep = 6
              if (combos.length > 0) {
                currentStep = 7
              }
            }
          }
        }
      }
    }
  }

  console.log(
    `[Onboarding] Status de conclusão: ${isCompleted}, Step: ${currentStep}`,
  )

  return {
    isCompleted: isCompleted,
    barbershopId: (user as any).barbershopId,
    plan: (user as any).subscriptionPlan,
    currentStep: currentStep,
    existingData,
  }
}

export const finishOnboarding = async () => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) throw new Error("Não autorizado")

  const user = await db.user.findUnique({ where: { id: authUser.id } })
  const barbershopId = user?.barbershopId
  if (!barbershopId) throw new Error("Barbearia não encontrada")

  await (db as any).barbershop.update({
    where: { id: barbershopId },
    data: { onboardingCompleted: true },
  })

  revalidatePath("/admin")
  return { success: true }
}
