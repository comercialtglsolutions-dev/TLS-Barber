import { db } from "@/app/_lib/prisma"
import { NextResponse } from "next/server"
import { createClient } from "@/app/_lib/supabase/server"

export async function GET() {
  const supabase = createClient()

  // Obter o usuário da sessão autenticada de forma segura
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 1. Tentar encontrar pelo ID do Supabase
    let user = await db.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionPlan: true,
        trialEndsAt: true,
        barbershopId: true,
      },
    })

    // 2. Se não encontrar pelo ID, tentar pelo Email (Migração do NextAuth)
    if (!user && authUser.email) {
      const existingUser = await db.user.findUnique({
        where: { email: authUser.email },
      })

      if (existingUser) {
        // Atualiza o usuário existente para ter o mesmo ID do Supabase
        await db.user.update({
          where: { email: authUser.email },
          data: { id: authUser.id },
        })

        user = {
          id: authUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          subscriptionPlan: existingUser.subscriptionPlan,
          trialEndsAt: existingUser.trialEndsAt,
          barbershopId: existingUser.barbershopId,
        }
      } else {
        // 3. Se não existe de jeito nenhum, cria um novo (Novo Cadastro)
        const role =
          authUser.user_metadata?.user_type === "BARBER" ? "ADMIN" : "USER"

        const newUser = await db.user.create({
          data: {
            id: authUser.id,
            email: authUser.email,
            name:
              authUser.user_metadata?.full_name || authUser.email.split("@")[0],
            role: role,
          },
        })

        user = {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          subscriptionPlan: newUser.subscriptionPlan,
          trialEndsAt: newUser.trialEndsAt,
          barbershopId: newUser.barbershopId,
        }
      }
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Erro no profile route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
