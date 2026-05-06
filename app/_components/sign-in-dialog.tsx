import { useState } from "react"
import { createClient } from "../_lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import Image from "next/image"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

const SignInDialog = ({
  defaultTab = "login",
  onClose,
}: {
  defaultTab?: "login" | "register" | "forgot-password"
  onClose?: () => void
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [isLoading, setIsLoading] = useState(false)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [barbershopName, setBarbershopName] = useState("")
  const [userType, setUserType] = useState<"CLIENT" | "BARBER">("CLIENT")
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegPassword, setShowRegPassword] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const handleLoginWithGoogleClick = async () => {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast.error("Erro ao entrar com Google.")
      setIsLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (error) {
        toast.error("E-mail ou senha incorretos.")
      } else {
        toast.success("Login realizado com sucesso!")
        onClose?.()
        router.refresh()
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao tentar entrar.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail) {
      toast.error("Por favor, digite seu e-mail para recuperar a senha.")
      return
    }
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success(
          "E-mail de recuperação enviado! Verifique sua caixa de entrada.",
        )
        setActiveTab("login")
      }
    } catch (error) {
      toast.error("Erro ao enviar e-mail de recuperação.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            full_name: regName,
            user_type: userType, // 'CLIENT' ou 'BARBER'
            barbershop_name: userType === "BARBER" ? barbershopName : undefined,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Verifique seu e-mail para confirmar a conta!")
        onClose?.()
      }
    } catch (error) {
      toast.error("Erro ao criar conta.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 duration-300 animate-in fade-in zoom-in-95">
      {activeTab === "forgot-password" ? (
        <div className="flex flex-col gap-6">
          <DialogHeader className="gap-1 text-center">
            <DialogTitle className="text-2xl font-extrabold tracking-tight text-white">
              Recuperar Senha
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400">
              Digite seu e-mail e enviaremos um link seguro para você redefinir
              sua senha.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-mail</Label>
              <Input
                id="reset-email"
                placeholder="Endereço de e-mail"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="h-11 rounded-xl border-white/10 bg-white/5 transition-all focus:border-[#2C78B2]/50"
              />
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-[#2C78B2] font-bold text-white shadow-[0_4px_14px_0_rgba(44,120,178,0.3)] transition-all hover:bg-[#1E5A8A]"
                disabled={isLoading}
              >
                Enviar link de recuperação
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full rounded-xl text-gray-400 hover:text-white"
                onClick={() => setActiveTab("login")}
                disabled={isLoading}
              >
                Voltar para o login
              </Button>
            </div>
          </form>
        </div>
      ) : activeTab === "login" ? (
        <div className="flex flex-col gap-6">
          <DialogHeader className="gap-1 text-center">
            <DialogTitle className="text-2xl font-extrabold tracking-tight text-white">
              Bem-vindo de volta
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400">
              Acesse sua conta para gerenciar seus agendamentos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                placeholder="Endereço de e-mail"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="h-11 rounded-xl border-white/10 bg-white/5 transition-all focus:border-[#2C78B2]/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  placeholder="Sua senha"
                  type={showLoginPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl border-white/10 bg-white/5 pr-10 transition-all focus:border-[#2C78B2]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-white"
                >
                  {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab("forgot-password")}
                  className="text-xs font-medium text-[#2C78B2] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="mt-2 h-11 w-full rounded-xl bg-[#2C78B2] font-bold text-white shadow-[0_4px_14px_0_rgba(44,120,178,0.3)] transition-all hover:bg-[#1E5A8A]"
              disabled={isLoading}
            >
              Entrar na conta
            </Button>
          </form>

          <SocialLogin
            isLoading={isLoading}
            onClick={handleLoginWithGoogleClick}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <DialogHeader className="gap-1 text-center">
            <DialogTitle className="text-2xl font-extrabold tracking-tight text-white">
              Criar sua conta
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400">
              Junte-se à maior plataforma de barbearias do Brasil.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            {/* User Type Toggle */}
            <div className="mb-2 flex rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setUserType("CLIENT")}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${userType === "CLIENT" ? "bg-[#2C78B2] text-white" : "text-gray-400 hover:text-white"}`}
              >
                Sou cliente
              </button>
              <button
                type="button"
                onClick={() => setUserType("BARBER")}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${userType === "BARBER" ? "bg-[#2C78B2] text-white" : "text-gray-400 hover:text-white"}`}
              >
                Sou dono de Barbearia
              </button>
            </div>

            {userType === "BARBER" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="reg-barbershop">Nome da Barbearia</Label>
                <Input
                  id="reg-barbershop"
                  placeholder="Ex: Barber Shop TLS"
                  value={barbershopName}
                  onChange={(e) => setBarbershopName(e.target.value)}
                  required
                  className="h-11 rounded-xl border-white/10 bg-white/5 transition-all focus:border-[#2C78B2]/50"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reg-name">
                {userType === "BARBER" ? "Seu nome" : "Nome completo"}
              </Label>
              <Input
                id="reg-name"
                placeholder="Seu nome e sobrenome"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                className="h-11 rounded-xl border-white/10 bg-white/5 transition-all focus:border-[#2C78B2]/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">E-mail</Label>
              <Input
                id="reg-email"
                placeholder="Endereço de e-mail"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                className="h-11 rounded-xl border-white/10 bg-white/5 transition-all focus:border-[#2C78B2]/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Senha</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  placeholder="Sua senha"
                  type={showRegPassword ? "text" : "password"}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl border-white/10 bg-white/5 pr-10 transition-all focus:border-[#2C78B2]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-white"
                >
                  {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="mt-2 h-11 w-full rounded-xl bg-[#2C78B2] font-bold text-white shadow-[0_4px_14px_0_rgba(44,120,178,0.3)] transition-all hover:bg-[#1E5A8A]"
              disabled={isLoading}
            >
              Cadastrar agora
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}

const SocialLogin = ({
  isLoading,
  onClick,
}: {
  isLoading: boolean
  onClick: () => void
}) => (
  <>
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-white/10" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-[#111111] px-2 font-medium text-gray-500">
          Ou continue com
        </span>
      </div>
    </div>

    <Button
      variant="outline"
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-6 font-bold text-white transition-all hover:border-white/20 hover:bg-white/10"
      onClick={onClick}
      disabled={isLoading}
    >
      <Image
        alt="Fazer login com o Google"
        src="/google.svg"
        width={20}
        height={20}
      />
      Google
    </Button>
  </>
)

export default SignInDialog
