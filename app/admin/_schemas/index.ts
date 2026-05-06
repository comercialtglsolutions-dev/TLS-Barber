import { z } from "zod"

export const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  imageUrl: z.string().min(1, "A imagem é obrigatória"),
  price: z.coerce.number().min(0.01, "Preço deve ser maior que zero"),
})

export type ServiceSchema = z.infer<typeof serviceSchema>

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  imageUrl: z.string().min(1, "A imagem é obrigatória"),
  price: z.coerce.number().min(0.01, "Preço deve ser maior que zero"),
})

export type ProductSchema = z.infer<typeof productSchema>

export const comboSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  imageUrl: z.string().min(1, "A imagem é obrigatória"),
  price: z.coerce.number().optional(),
  service1Id: z.string().min(1, "Selecione o primeiro serviço"),
  service2Id: z.string().min(1, "Selecione o segundo serviço"),
})

export type ComboSchema = z.infer<typeof comboSchema>

export const manualBookingSchema = z
  .object({
    userId: z.string().min(1, "Selecione o cliente"),
    serviceId: z.string().optional(),
    comboId: z.string().optional(),
    date: z.date({
      required_error: "Selecione a data",
    }),
    hour: z.string().min(1, "Selecione o horário"),
  })
  .refine((data) => data.serviceId || data.comboId, {
    message: "Selecione um serviço ou um combo",
    path: ["serviceId"],
  })

export type ManualBookingSchema = z.infer<typeof manualBookingSchema>

export const settingsSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  imageUrl: z.string().min(1, "A imagem é obrigatória"),
  startHour: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Horário inválido (HH:mm)")
    .optional(),
  endHour: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Horário inválido (HH:mm)")
    .optional(),
  phones: z.array(z.string()).optional(),
  instagramUrl: z
    .string()
    .url("URL do Instagram inválida")
    .optional()
    .or(z.literal("")),
  whatsappUrl: z.string().optional(),
})

export type SettingsSchema = z.infer<typeof settingsSchema>
export const manualSaleSchema = z.object({
  userId: z.string().min(1, "Selecione o cliente"),
  productId: z.string().min(1, "Selecione o produto"),
  quantity: z.coerce.number().min(1, "A quantidade deve ser pelo menos 1"),
})

export type ManualSaleSchema = z.infer<typeof manualSaleSchema>

export const userProfileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().optional(),
  cpf: z.string().optional(),
})

export type UserProfileSchema = z.infer<typeof userProfileSchema>
