"use client"

import { useState, useEffect } from "react"
import { createClient } from "../_lib/supabase/client"
import { Button } from "./ui/button"
import Image from "next/image"
import { toast } from "sonner"
import { CheckCircle2, Unlink, Loader2 } from "lucide-react"

const GoogleLinkButton = () => {
  const [isLinked, setIsLinked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLinking, setIsLinking] = useState(false)
  const [googleEmail, setGoogleEmail] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkIdentities = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const googleIdentity = user.identities?.find(
            (identity) => identity.provider === "google",
          )
          if (googleIdentity) {
            setIsLinked(true)
            setGoogleEmail(googleIdentity.identity_data?.email || null)
          } else {
            setIsLinked(false)
          }
        }
      } catch (error) {
        console.error("Erro ao verificar identidades:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkIdentities()
  }, [supabase])

  const handleLinkGoogle = async () => {
    setIsLinking(true)
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${window.location.pathname}${window.location.search}`,
        },
      })

      if (error) {
        if (error.message.includes("Manual linking is disabled")) {
          toast.error(
            "O vínculo manual está desativado no Supabase. Habilite 'Manual Linking' em Authentication > Providers.",
            {
              duration: 6000,
            },
          )
        } else if (error.message.includes("already linked")) {
          toast.error("Esta conta Google já está vinculada a outro usuário.")
        } else {
          toast.error("Erro ao vincular conta Google.")
        }
        console.error(error)
      }
    } catch (error) {
      toast.error("Ocorreu um erro inesperado.")
    } finally {
      setIsLinking(false)
    }
  }

  const handleUnlinkGoogle = async () => {
    setIsLinking(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const googleIdentity = user?.identities?.find(
        (id) => id.provider === "google",
      )

      console.log("Objeto Google Identity Completo:", googleIdentity)

      // O UUID real da identidade está no campo identity_id conforme os logs
      const idToUnlink =
        (googleIdentity as any)?.identity_id || googleIdentity?.id

      if (
        !idToUnlink ||
        (idToUnlink.length < 20 && !idToUnlink.includes("-"))
      ) {
        console.error("O ID encontrado não parece um UUID:", idToUnlink)
        toast.error("Erro técnico: ID de identidade inválido.")
        setIsLinking(false)
        return
      }

      console.log("Enviando para desvincular (UUID):", idToUnlink)

      // Algumas versões do Supabase usam { identityId: string }, outras { id: string }
      // Usaremos 'as any' para garantir que passe
      const auth = supabase.auth as any
      const { error } = await auth.unlinkIdentity({
        identityId: idToUnlink,
        identity_id: idToUnlink,
      })

      if (error) {
        toast.error("Erro ao desvincular conta.")
        console.error("Erro Supabase detalhado:", error)
      } else {
        setIsLinked(false)
        setGoogleEmail(null)
        toast.success("Conta Google desvinculada.")
      }
    } catch (error) {
      console.error("Erro inesperado no processo:", error)
      toast.error("Erro inesperado.")
    } finally {
      setIsLinking(false)
    }
  }

  if (isLoading) {
    return (
      <Button
        variant="outline"
        disabled
        className="h-12 w-full border-white/10 bg-white/5"
      >
        Carregando...
      </Button>
    )
  }

  if (isLinked) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 transition-all hover:bg-white/[0.05]">
        <div className="flex items-center gap-4">
          {/* Logo Google com Selo sobreposto */}
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.26 1.07-3.71 1.07-2.87 0-5.3-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.11c-.22-.67-.35-1.39-.35-2.11s.13-1.44.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1c-2.97 0-5.46.98-7.28 2.66l3.66 2.83c.86-2.59 3.29-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </div>
            {/* Selo de Check sobreposto ao logo */}
            <div className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-[#1D1D1D] bg-green-500 p-1 shadow-lg">
              <CheckCircle2 size={10} className="text-white" />
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-bold uppercase tracking-wider text-white">
              Google Vinculado
            </span>
            <span className="max-w-[150px] break-all text-[10px] font-bold text-gray-500 md:max-w-[200px]">
              {googleEmail || "Conta Verificada"}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleUnlinkGoogle}
          disabled={isLinking}
          className="h-10 w-10 rounded-full text-gray-500 transition-all hover:bg-red-500/10 hover:text-red-500"
          title="Desvincular conta Google"
        >
          {isLinking ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Unlink size={18} />
          )}
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={handleLinkGoogle}
      disabled={isLinking}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-6 font-bold text-white transition-all hover:border-white/20 hover:bg-white/10"
    >
      <Image
        alt="Vincular conta Google"
        src="/google.svg"
        width={20}
        height={20}
      />
      {isLinking ? "Vinculando..." : "Vincular conta Google"}
    </Button>
  )
}

export default GoogleLinkButton
