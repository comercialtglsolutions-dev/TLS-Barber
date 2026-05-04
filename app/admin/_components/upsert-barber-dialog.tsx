/* eslint-disable no-unused-vars */
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form"
import { Input } from "@/app/_components/ui/input"
import { Button } from "@/app/_components/ui/button"
import { Textarea } from "@/app/_components/ui/textarea"
import { toast } from "sonner"
import { Loader2Icon, PencilIcon, PlusIcon, UserIcon } from "lucide-react"
import { upsertBarber } from "@/app/_actions/upsert-barber"
import { uploadImage } from "@/app/_actions/upload-image"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/_components/ui/avatar"
import { useRef } from "react"
import { cn } from "@/app/_lib/utils"

const barberSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
})

type BarberFormValues = z.infer<typeof barberSchema>

interface UpsertBarberDialogProps {
  defaultValues?: BarberFormValues
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
  disabled?: boolean
  disabledMessage?: string
}

const UpsertBarberDialog = ({
  defaultValues,
  isOpen: externalOpen,
  onOpenChange: externalOnOpenChange,
  hideTrigger = false,
  disabled = false,
  disabledMessage,
}: UpsertBarberDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isOpen = externalOpen ?? internalOpen
  const setIsOpen = externalOnOpenChange ?? setInternalOpen

  const form = useForm<BarberFormValues>({
    resolver: zodResolver(barberSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
      imageUrl: "",
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", file)

      const url = await uploadImage(formData)
      form.setValue("imageUrl", url)
      toast.success("Imagem enviada!")
    } catch (error) {
      toast.error("Erro ao enviar imagem.")
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (values: BarberFormValues) => {
    setIsLoading(true)
    try {
      await upsertBarber(values)
      toast.success(values.id ? "Barbeiro atualizado!" : "Barbeiro cadastrado!")
      setIsOpen(false)
      if (!values.id) form.reset()
    } catch (error) {
      toast.error("Erro ao salvar barbeiro.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          {defaultValues?.id ? (
            <Button variant="ghost" size="icon" className="text-gray-400">
              <PencilIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="gap-2 bg-[#3EABFD] font-bold text-white hover:bg-[#3EABFD]/80"
              disabled={disabled}
              title={disabled ? disabledMessage : ""}
            >
              <PlusIcon className="h-4 w-4" />
              Adicionar Barbeiro
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="border-white/10 bg-[#1A1A1A] text-white">
        <DialogHeader>
          <DialogTitle>
            {defaultValues?.id ? "Editar Barbeiro" : "Novo Barbeiro"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="mb-4 flex flex-col items-center justify-center gap-2">
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={cn(
                  "relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-white/10 transition hover:border-[#3EABFD]/50",
                  isUploading && "cursor-not-allowed opacity-50",
                )}
              >
                <Avatar className="h-full w-full">
                  <AvatarImage
                    src={form.watch("imageUrl")}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-[#222]">
                    <UserIcon className="h-10 w-10 text-gray-400" />
                  </AvatarFallback>
                </Avatar>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2Icon className="h-6 w-6 animate-spin text-[#3EABFD]" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition hover:opacity-100">
                  <PlusIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-[10px] text-gray-400">
                Clique para alterar a foto
              </span>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome do barbeiro"
                      className="border-white/10 bg-[#222]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição / Especialidade</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Especialista em degradê e barba"
                      className="border-white/10 bg-[#222]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#3EABFD] font-bold text-white hover:bg-[#3EABFD]/80"
                disabled={isLoading}
              >
                {isLoading && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {defaultValues?.id ? "Salvar Alterações" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default UpsertBarberDialog
