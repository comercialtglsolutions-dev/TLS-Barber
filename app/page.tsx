"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Calendar,
  MessageCircle,
  CreditCard,
  ShoppingBag,
  BarChart3,
  Menu,
  TrendingUp,
  Clock,
  Shield,
  ChevronRight,
  ArrowRight,
  Zap,
  LogOut,
} from "lucide-react"
import { useAuth } from "./_providers/auth"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "./_components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "./_components/ui/sheet"
import { Button } from "./_components/ui/button"
import SignInDialog from "./_components/sign-in-dialog"

import PricingCards from "./_components/pricing-cards"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  const [loginTab, setLoginTab] = useState<"login" | "register">("login")
  const [stripePrices, setStripePrices] = useState<{
    barber: number | null
    premium: number | null
  } | null>(null)

  const openAuthModal = (tab: "login" | "register") => {
    setLoginTab(tab)
    setLoginOpen(true)
  }
  const { user, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const { getStripePrices } = await import("./_actions/get-stripe-prices")
        const prices = await getStripePrices()
        setStripePrices(prices)
      } catch (error) {
        console.error("Erro ao carregar preços:", error)
      }
    }
    fetchPrices()
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const problems = [
    {
      icon: MessageCircle,
      title: "Caos no WhatsApp",
      description:
        "Pare de perder horas respondendo agendamentos manualmente enquanto deveria estar na cadeira.",
    },
    {
      icon: Calendar,
      title: "Cadeiras Vazias",
      description:
        'O "no-show" é o inimigo do seu lucro. Automatize lembretes e garanta sua agenda cheia.',
    },
    {
      icon: BarChart3,
      title: "Gestão no Escuro",
      description:
        "Saiba exatamente quanto sua barbearia fatura e qual barbeiro é o mais produtivo.",
    },
  ]

  const features = [
    {
      icon: Calendar,
      title: "Agenda Inteligente 24/7",
      description:
        "Seu cliente marca o horário em segundos, de qualquer lugar, a qualquer hora.",
      highlight: true,
      plan: "FREE",
    },
    {
      icon: MessageCircle,
      title: "Lembretes via Sistema",
      description:
        "Reduza faltas drasticamente com notificações automáticas para seus clientes.",
      highlight: true,
      plan: "BARBER",
    },
    {
      icon: CreditCard,
      title: "Pagamentos Antecipados",
      description:
        "Garanta seu faturamento com pagamentos via Stripe direto no agendamento.",
      highlight: false,
      plan: "PREMIUM",
    },
    {
      icon: BarChart3,
      title: "Analytics de Elite",
      description:
        "Dashboards financeiros completos e controle de comissões automatizado.",
      highlight: false,
      plan: "BARBER",
    },
    {
      icon: ShoppingBag,
      title: "PDV & Frente de Caixa",
      description:
        "Venda produtos e controle seu estoque de forma integrada ao financeiro.",
      highlight: false,
      plan: "PREMIUM",
    },
    {
      icon: Shield,
      title: "Gestão VIP",
      description:
        "Suporte prioritário e ferramentas avançadas para barbearias de alto nível.",
      highlight: false,
      plan: "PREMIUM",
    },
  ]

  const stats = [
    { value: "+85%", label: "Redução em Faltas", icon: TrendingUp },
    { value: "3x", label: "Mais Agilidade", icon: Zap },
    { value: "2h", label: "Livres por Dia", icon: Clock },
    { value: "100%", label: "Controle Financeiro", icon: Shield },
  ]

  const faqs = [
    {
      question: "Como funciona o período de teste?",
      answer:
        "Você tem 15 dias para explorar todas as funcionalidades do plano Premium sem precisar cadastrar cartão de crédito.",
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer:
        "Sim, não temos contratos de fidelidade. Você pode cancelar sua assinatura quando desejar.",
    },
    {
      question: "O sistema funciona no celular?",
      answer:
        "Sim! O TLS-Barber é totalmente responsivo e funciona perfeitamente em smartphones, tablets e computadores.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#2C78B2] selection:text-black">
      {/* Navigation */}
      <nav
        className={`fixed z-50 w-full transition-all duration-300 ${scrolled ? "border-b border-white/10 bg-[#0A0A0A]/80 py-4 backdrop-blur-md" : "bg-transparent py-6"}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo (Left) */}
          <Link
            href="/"
            className="group flex flex-1 items-center gap-2 transition-opacity hover:opacity-80"
          >
            <Image
              src="/Logo.svg"
              alt="TLS Barber"
              width={130}
              height={22}
              className="h-7 w-auto md:h-8"
            />
          </Link>

          {/* Nav Links (Center) */}
          <div className="hidden flex-1 items-center justify-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-gray-400 transition-colors hover:text-[#2C78B2]"
            >
              Funcionalidades
            </a>
            <a
              href="#plans"
              className="text-sm font-medium text-gray-400 transition-colors hover:text-[#2C78B2]"
            >
              Planos
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-gray-400 transition-colors hover:text-[#2C78B2]"
            >
              FAQ
            </a>
          </div>

          {/* Auth Buttons (Right) */}
          <div className="hidden flex-1 items-center justify-end gap-4 md:flex">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-400">
                  Olá,{" "}
                  <span className="text-white">{user.name?.split(" ")[0]}</span>
                </span>
                <Button
                  className="group rounded-xl bg-[#2C78B2] px-6 font-bold text-white shadow-lg shadow-[#2C78B2]/20 hover:bg-[#1E5A8A]"
                  onClick={() => router.push("/dashboard")}
                >
                  Acessar Sistema
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl text-gray-400 transition-all hover:bg-red-500/10 hover:text-red-500"
                  onClick={() => signOut()}
                  title="Sair do sistema"
                >
                  <LogOut size={20} />
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-white"
                  onClick={() => openAuthModal("login")}
                >
                  Entrar
                </Button>
                <Button
                  className="rounded-xl bg-[#2C78B2] px-6 font-bold text-white shadow-lg shadow-[#2C78B2]/20 hover:bg-[#1E5A8A]"
                  onClick={() => openAuthModal("register")}
                >
                  Registrar
                </Button>
              </>
            )}
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="text-white md:hidden">
                <Menu />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-[85%] flex-col border-white/10 bg-[#0A0A0A] p-6 pt-12 text-white"
            >
              <SheetHeader className="mb-8 text-left">
                <SheetTitle className="text-2xl font-bold text-white">
                  Menu
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-6">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-gray-400 transition-colors hover:text-[#2C78B2]"
                >
                  Funcionalidades
                </a>
                <a
                  href="#plans"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-gray-400 transition-colors hover:text-[#2C78B2]"
                >
                  Planos
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-gray-400 transition-colors hover:text-[#2C78B2]"
                >
                  FAQ
                </a>

                <div className="mt-4 flex flex-col gap-4 border-t border-white/10 pt-8">
                  {user ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2C78B2]/10 text-sm font-bold text-[#2C78B2]">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{user.name}</span>
                          <span className="text-xs text-gray-500">
                            Bem-vindo de volta
                          </span>
                        </div>
                      </div>
                      <Button
                        className="h-12 w-full rounded-xl bg-[#2C78B2] font-bold text-white shadow-lg shadow-[#2C78B2]/20 hover:bg-[#1E5A8A]"
                        onClick={() => {
                          setMobileMenuOpen(false)
                          router.push("/dashboard")
                        }}
                      >
                        Acessar Sistema
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-12 w-full justify-start gap-2 rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-500"
                        onClick={() => {
                          setMobileMenuOpen(false)
                          signOut()
                        }}
                      >
                        <LogOut size={20} />
                        Sair do sistema
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        className="h-12 w-full justify-start text-lg text-gray-300 hover:text-white"
                        onClick={() => {
                          setMobileMenuOpen(false)
                          openAuthModal("login")
                        }}
                      >
                        Entrar
                      </Button>
                      <Button
                        className="h-12 w-full rounded-xl bg-[#2C78B2] text-lg font-bold text-white shadow-lg shadow-[#2C78B2]/20 hover:bg-[#1E5A8A]"
                        onClick={() => {
                          setMobileMenuOpen(false)
                          openAuthModal("register")
                        }}
                      >
                        Registrar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pb-20 pt-32 md:pb-32 md:pt-48">
        <div className="pointer-events-none absolute left-1/2 top-0 h-full w-full max-w-6xl -translate-x-1/2">
          <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-[#2C78B2]/10 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-10%] h-[30%] w-[30%] rounded-full bg-[#2C78B2]/5 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#2C78B2]" />
              <span className="text-xs font-medium uppercase tracking-widest text-gray-300">
                O Futuro da Barbearia Chegou
              </span>
            </div>
            <h1 className="mb-8 text-5xl font-extrabold leading-[1.1] tracking-tight md:text-7xl lg:text-8xl">
              Tecnologia de Elite para o{" "}
              <span className="text-[#2C78B2]">Mestre da Navalha.</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-400 md:text-xl">
              Do agendamento inteligente à gestão financeira completa. O sistema
              definitivo para barbearias que não aceitam nada menos que a
              perfeição.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 delay-300 duration-1000 animate-in fade-in slide-in-from-bottom-6 sm:flex-row">
              {user ? (
                <Button
                  size="lg"
                  className="group h-14 rounded-2xl bg-[#2C78B2] px-12 font-bold text-white shadow-2xl shadow-[#2C78B2]/30 transition-all hover:scale-105 hover:bg-[#1E5A8A] active:scale-95"
                  onClick={() => router.push("/dashboard")}
                >
                  Ir para o Dashboard
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="group h-14 rounded-2xl bg-[#2C78B2] px-10 font-bold text-white shadow-2xl shadow-[#2C78B2]/30 transition-all hover:scale-105 hover:bg-[#1E5A8A] active:scale-95"
                    onClick={() => openAuthModal("register")}
                  >
                    Começar Teste Grátis
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 rounded-2xl border-white/10 bg-white/5 px-10 font-bold text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/10 active:scale-95"
                    onClick={() => openAuthModal("login")}
                  >
                    Acessar minha conta
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/5 bg-white/[0.02] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="mb-1 text-3xl font-bold text-white md:text-4xl">
                  {stat.value}
                </div>
                <div className="text-xs font-medium uppercase tracking-wider text-[#2C78B2] md:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <h2 className="mb-6 text-3xl font-bold md:text-5xl">
              Por que mudar agora?
            </h2>
            <p className="mx-auto max-w-2xl text-gray-400">
              Gerir uma barbearia de sucesso exige mais do que talento com a
              tesoura. Exige eficiência.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {problems.map((prob, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-white/5 bg-[#171717] p-8 transition-all hover:border-[#2C78B2]/30"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2C78B2]/10 transition-transform group-hover:scale-110">
                  <prob.icon className="h-6 w-6 text-[#2C78B2]" />
                </div>
                <h3 className="mb-4 text-xl font-bold">{prob.title}</h3>
                <p className="leading-relaxed text-gray-400">
                  {prob.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-[#0F0F0F] py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 flex flex-col items-end justify-between gap-6 md:flex-row">
            <div className="max-w-2xl">
              <h2 className="mb-6 text-4xl font-bold md:text-6xl">
                Tudo que você precisa em um só lugar.
              </h2>
              <p className="text-lg text-gray-400">
                Desenvolvemos cada funcionalidade ouvindo quem realmente entende
                do negócio: os barbeiros.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-bold text-[#2C78B2] hover:underline"
            >
              Ver todos os módulos <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-3xl border p-8 transition-all hover:scale-[1.02] ${feat.highlight ? "border-[#2C78B2]/20 bg-[#171717]" : "border-white/5 bg-transparent hover:bg-white/[0.02]"}`}
              >
                <div
                  className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${feat.plan === "PREMIUM" ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-[#2C78B2]/10 text-[#2C78B2]"}`}
                >
                  <feat.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">
                  {feat.title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-gray-400">
                  {feat.description}
                </p>
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${feat.plan === "PREMIUM" ? "text-[#D4AF37]" : feat.plan === "BARBER" ? "text-[#2C78B2]" : "text-gray-500"}`}
                >
                  {feat.plan === "PREMIUM"
                    ? "Exclusivo Premium"
                    : feat.plan === "BARBER"
                      ? "Disponível no Barber"
                      : "Plano Gratuito"}
                </span>
                {feat.plan === "PREMIUM" && (
                  <div className="absolute -right-8 -top-8 h-24 w-24 rotate-12 bg-[#D4AF37]/5 blur-2xl" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="plans" className="py-24 md:py-32">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-16 space-y-4 text-center">
            <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              Planos que crescem com você
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-400">
              Escolha a ferramenta certa para o seu momento. Do barbeiro solo às
              grandes redes de barbearias de elite.
            </p>
          </div>
          <PricingCards initialPrices={stripePrices} />
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-[#0F0F0F] py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-16 text-center text-3xl font-bold md:text-5xl">
            Dúvidas Frequentes
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-white/5"
              >
                <button
                  onClick={() => setActiveTab(activeTab === i ? null : i)}
                  className="flex w-full items-center justify-between p-6 text-left transition-all hover:bg-white/[0.02]"
                >
                  <span className="font-bold">{faq.question}</span>
                  <ChevronRight
                    className={`h-5 w-5 transition-transform ${activeTab === i ? "rotate-90" : ""}`}
                  />
                </button>
                {activeTab === i && (
                  <div className="border-t border-white/5 p-6 pt-0 text-sm leading-relaxed text-gray-400">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-24 md:py-40">
        <div className="pointer-events-none absolute inset-0 bg-[#2C78B2]/5" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-8 text-5xl font-bold md:text-7xl">
            Pronto para elevar o nível?
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-xl text-gray-400">
            Junte-se a centenas de barbearias que já transformaram sua gestão
            com o TLS-Barber.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex rounded-2xl bg-[#D4AF37] px-12 py-5 text-xl font-bold text-black shadow-xl shadow-[#2C78B2]/20 transition-all hover:bg-[#B8962E]"
          >
            Começar Agora Gratuitamente
          </Link>
          <p className="mt-6 text-sm text-gray-500">
            Sem cartão de crédito. Cancele quando quiser.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-4 sm:px-6 md:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <Image
              src="/Logo.svg"
              alt="TLS Barber"
              width={100}
              height={18}
              className="h-5 w-auto opacity-60 transition-opacity hover:opacity-100"
            />
          </div>
          <p className="text-sm text-gray-500">
            © 2026 TLS-Barber. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-gray-500 transition-colors hover:text-white"
            >
              Termos
            </a>
            <a
              href="#"
              className="text-gray-500 transition-colors hover:text-white"
            >
              Privacidade
            </a>
          </div>
        </div>
      </footer>

      {/* Login Dialog */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="max-w-md border border-white/10 bg-[#111111] p-8 shadow-2xl shadow-black/50">
          <div className="mb-2 flex flex-col items-center gap-2">
            <Image
              src="/Logo.svg"
              alt="TLS Barber"
              width={140}
              height={24}
              className="mb-2"
            />
          </div>
          <SignInDialog
            key={loginTab}
            defaultTab={loginTab}
            onClose={() => setLoginOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
