"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/app/_components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form"
import { Input } from "@/app/_components/ui/input"
import { Textarea } from "@/app/_components/ui/textarea"
import { toast } from "sonner"
import { Settings } from "@prisma/client"
import { settingsSchema, SettingsSchema } from "../_schemas"
import { upsertSettings } from "@/app/_actions/upsert-settings"
import ImageUpload from "./image-upload"
import GoogleLinkButton from "@/app/_components/google-link-button"
import { ShieldCheck } from "lucide-react"

interface SettingsFormProps {
  settings: Settings
}

const SettingsForm = ({ settings }: SettingsFormProps) => {
  const form = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: settings.name || "",
      address: settings.address || "",
      description: settings.description || "",
      imageUrl: settings.imageUrl || "",
      startHour: (settings as any).startHour || "09:00",
      endHour: (settings as any).endHour || "19:00",
      phones: settings.phones || [],
      instagramUrl: (settings as any).instagramUrl || "",
      whatsappUrl: (settings as any).whatsappUrl || "",
    },
  })

  const onSubmit = async (data: SettingsSchema) => {
    try {
      await upsertSettings(data)
      toast.success("Configurações atualizadas com sucesso!")
    } catch (error) {
      toast.error("Erro ao atualizar configurações.")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Barbearia</FormLabel>
                <FormControl>
                  <Input placeholder="TGL Barber" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Rua..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Sobre a barbearia..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phones"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input
                  placeholder="(11) 99999-9999"
                  value={field.value?.[0] || ""}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "")
                    if (value.length > 11) value = value.slice(0, 11)

                    // Mask (XX) XXXXX-XXXX
                    if (value.length > 2) {
                      value = `(${value.slice(0, 2)}) ${value.slice(2)}`
                    }
                    if (value.length > 10) {
                      value = `${value.slice(0, 10)}-${value.slice(10)}`
                    }

                    field.onChange([value])
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="instagramUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link do Instagram</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://instagram.com/suabarbearia"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="whatsappUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link do WhatsApp</FormLabel>
                <FormControl>
                  <Input placeholder="https://wa.me/55..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem de Capa</FormLabel>
              <FormControl>
                <ImageUpload value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Salvar Configurações</Button>
      </form>

      <div className="mt-8 border-t border-white/10 pt-8">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <ShieldCheck size={20} className="text-primary" />
          Segurança da Conta
        </h3>
        <p className="mb-6 text-sm text-gray-400">
          Vincule sua conta administrativa ao Google para facilitar o acesso.
        </p>
        <div className="max-w-md">
          <GoogleLinkButton />
        </div>
      </div>
    </Form>
  )
}

export default SettingsForm
