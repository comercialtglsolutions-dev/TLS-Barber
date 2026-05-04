"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "../_lib/supabase/client"
import { Button } from "../_components/ui/button"
import { Input } from "../_components/ui/input"
import { Label } from "../_components/ui/label"
import { toast } from "sonner"
import Image from "next/image"
import { Eye, EyeOff, Lock } from "lucide-react"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Verifica se o usuário tem uma sessão válida (o link de reset cria uma sessão temporária)
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        toast.error("Link de recuperação inválido ou expirado.")
        router.push("/")
      }
    }
    checkSession()
  }, [router, supabase])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.")
      return
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        toast.error("Erro ao atualizar a senha: " + error.message)
      } else {
        toast.success("Senha atualizada com sucesso!")
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error) {
      toast.error("Ocorreu um erro inesperado.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] p-4 text-white">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-[#111111] p-8 shadow-2xl">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <Image
            src="/Logo.svg"
            alt="TLS Barber"
            width={160}
            height={30}
            className="mb-4"
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2C78B2]/20">
            <Lock className="h-6 w-6 text-[#2C78B2]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Redefinir Senha</h2>
          <p className="text-sm text-gray-400">
            Crie uma nova senha segura para sua conta.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua nova senha"
                  required
                  className="h-11 rounded-xl border-white/10 bg-white/5 pr-10 focus:border-[#2C78B2]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  className="h-11 rounded-xl border-white/10 bg-white/5 pr-10 focus:border-[#2C78B2]/50"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-xl bg-[#2C78B2] font-bold text-white shadow-[0_4px_14px_0_rgba(44,120,178,0.3)] hover:bg-[#1E5A8A]"
          >
            {isLoading ? "Atualizando..." : "Atualizar e Entrar"}
          </Button>
        </form>
      </div>
    </div>
  )
}
