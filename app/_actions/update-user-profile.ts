"use server"

import { db } from "../_lib/prisma"
import { createClient } from "../_lib/supabase/server"
import { revalidatePath } from "next/cache"

interface UpdateUserProfileParams {
  name: string
  phone?: string
  cpf?: string
}

export const updateUserProfile = async (params: UpdateUserProfileParams) => {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Usuário não autenticado")
  }

  await db.user.update({
    where: {
      id: user.id,
    },
    data: {
      name: params.name,
      phone: params.phone,
      cpf: params.cpf,
    },
  })

  revalidatePath("/settings")
  revalidatePath("/admin")
}
