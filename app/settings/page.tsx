"use client"

import { useAuth } from "../_providers/auth"
import Header from "../_components/header"
import { Label } from "../_components/ui/label"
import { Input } from "../_components/ui/input"
import { Button } from "../_components/ui/button"
import GoogleLinkButton from "../_components/google-link-button"
import {
  Phone,
  FileText,
  Save,
  Loader2,
  User,
  Mail,
  Shield,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { userProfileSchema, UserProfileSchema } from "../admin/_schemas"
import { updateUserProfile } from "../_actions/update-user-profile"
import { toast } from "sonner"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../_components/ui/form"

const SettingsPage = () => {
  const { profile, loading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<UserProfileSchema>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: "",
      phone: "",
      cpf: "",
    },
  })

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        phone: profile.phone || "",
        cpf: profile.cpf || "",
      })
    }
  }, [profile, form])

  const onSubmit = async (data: UserProfileSchema) => {
    setIsSubmitting(true)
    try {
      await updateUserProfile(data)
      toast.success("Configurações salvas.")
    } catch (error) {
      toast.error("Erro ao salvar.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1D1D1D]">
        <Header />
        <div className="mx-auto max-w-6xl animate-pulse px-6 pt-20">
          <div className="grid grid-cols-1 gap-20 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="mb-12 h-8 w-48 bg-white/5" />
              <div className="h-24 w-full rounded-lg bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1D1D1D] text-white">
      <Header />

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12">
        <header className="mb-12">
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="mt-2 text-gray-400">
            Gerencie suas informações e segurança da conta.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-20 lg:grid-cols-2">
          {/* LADO ESQUERDO: INFORMAÇÕES PESSOAIS */}
          <div className="space-y-10">
            <div className="border-b border-white/5 pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#2C78B2]">
                Informações Pessoais
              </h2>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <div className="grid gap-6">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-bold uppercase text-gray-500">
                      Nome completo
                    </Label>
                    <div className="flex items-center gap-3 border-b border-white/5 py-3 opacity-50">
                      <User size={18} className="text-gray-400" />
                      <span className="text-base font-semibold">
                        {profile?.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-bold uppercase text-gray-500">
                      E-mail
                    </Label>
                    <div className="flex items-center gap-3 border-b border-white/5 py-3 opacity-50">
                      <Mail size={18} className="text-gray-400" />
                      <span className="text-base font-semibold">
                        {profile?.email}
                      </span>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-xs font-bold uppercase text-gray-500">
                          Telefone celular
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="(00) 00000-0000"
                              {...field}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, "")
                                if (val.length > 11) val = val.slice(0, 11)
                                if (val.length > 2)
                                  val = `(${val.slice(0, 2)}) ${val.slice(2)}`
                                if (val.length > 10)
                                  val = `${val.slice(0, 10)}-${val.slice(10)}`
                                field.onChange(val)
                              }}
                              className="h-12 rounded-none border-0 border-b border-white/10 bg-transparent px-0 text-base font-semibold text-white transition-colors placeholder:text-gray-800 focus-visible:border-[#2C78B2] focus-visible:ring-0"
                            />
                            <Phone
                              className="absolute right-0 top-3 text-gray-600"
                              size={18}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-xs font-bold uppercase text-gray-500">
                          Documento (CPF)
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="000.000.000-00"
                              {...field}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, "")
                                if (val.length > 11) val = val.slice(0, 11)
                                if (val.length > 3)
                                  val = `${val.slice(0, 3)}.${val.slice(3)}`
                                if (val.length > 7)
                                  val = `${val.slice(0, 7)}.${val.slice(7)}`
                                if (val.length > 11)
                                  val = `${val.slice(0, 11)}-${val.slice(11)}`
                                field.onChange(val)
                              }}
                              className="h-12 rounded-none border-0 border-b border-white/10 bg-transparent px-0 text-base font-semibold text-white transition-colors placeholder:text-gray-800 focus-visible:border-[#2C78B2] focus-visible:ring-0"
                            />
                            <FileText
                              className="absolute right-0 top-3 text-gray-600"
                              size={18}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-start">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex h-12 items-center gap-2 rounded-xl bg-[#2C78B2] px-10 font-bold text-white transition-all hover:bg-[#1E5A8A]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Save size={18} />
                    )}
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* LADO DIREITO: SEGURANÇA */}
          <div className="space-y-10">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                Segurança da Conta
              </h2>
              <Shield size={16} className="text-gray-600" />
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
              <div className="mb-6">
                <h3 className="mb-2 text-lg font-bold text-white">
                  Vínculo Google
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  Utilize sua conta Google para facilitar o acesso à plataforma.
                </p>
              </div>
              <GoogleLinkButton />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SettingsPage
