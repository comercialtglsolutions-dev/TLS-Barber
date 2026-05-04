"use server"

import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { createClient } from "../_lib/supabase/server"
import { db } from "../_lib/prisma"

export const uploadImage = async (formData: FormData) => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) throw new Error("Não autorizado")

  const user = await db.user.findUnique({ where: { id: authUser.id } })

  if (user?.role !== "ADMIN") {
    throw new Error("Não autorizado")
  }

  const file = formData.get("file") as File
  if (!file) {
    throw new Error("Nenhum arquivo enviado")
  }

  const bytes = await file.arrayBuffer()
  const buffer = new Uint8Array(bytes)

  const uploadDir = join(process.cwd(), "public", "uploads")

  try {
    await mkdir(uploadDir, { recursive: true })
  } catch (err) {
    // Ignore if directory already exists
  }

  // Create a unique filename
  const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`
  const filepath = join(uploadDir, filename)

  await writeFile(filepath, buffer)

  return `/uploads/${filename}`
}
