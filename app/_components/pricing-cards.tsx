"use client"

import { ArrowRight, Check } from "lucide-react"
import { Button } from "./ui/button"
import { toast } from "sonner"
import { createStripeCheckout } from "@/app/_actions/create-stripe-checkout"

interface PricingCardsProps {
  userId?: string
  currentPlan?: string
  initialPrices?: {
    barber: number | null
    premium: number | null
  } | null
}

const PricingCards = ({ currentPlan, initialPrices }: PricingCardsProps) => {
  const handleSubscribe = async (planName: string) => {
    if (planName === "Gratuito") return

    const priceIds: Record<string, string | undefined> = {
      "Plano Barber": process.env.NEXT_PUBLIC_STRIPE_BARBER_PRICE_ID,
      "Plano Premium": process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    }

    const priceId = priceIds[planName]

    if (!priceId) {
      return toast.error("Configuração de preço não encontrada.")
    }

    try {
      toast.loading("Iniciando checkout...")
      const { url } = await createStripeCheckout(priceId)
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      toast.dismiss()
      toast.error("Erro ao conectar com o Stripe.")
    }
  }

  const plans = [
    {
      id: "FREE",
      name: "Gratuito",
      price: "0",
      description:
        "O primeiro passo para organizar sua barbearia e começar a lotar sua agenda.",
      features: [
        "15 Dias de Acesso Total",
        "Agenda Online 24/7",
        "Link de Agendamento Único",
        "Cadastro de até 50 Clientes",
        "Suporte via Central de Ajuda",
      ],
      cta:
        currentPlan === "FREE" || !currentPlan
          ? "Seu Plano Atual"
          : "Começar Teste Grátis",
      highlighted: false,
      disabled: currentPlan === "FREE" || !currentPlan,
    },
    {
      id: "BARBER",
      name: "Plano Barber",
      price: initialPrices?.barber ? initialPrices.barber.toString() : "89,99",
      description:
        "Eleve o nível da sua gestão com controle total de equipe, comissões e relatórios detalhados.",
      features: [
        "Profissionais Ilimitados",
        "Gestão de Comissões",
        "Dashboard Financeiro",
        "Relatórios de Agendamentos",
        "Suporte via WhatsApp",
      ],
      cta:
        currentPlan === "BARBER" ? "Seu Plano Atual" : "Assinar Plano Barber",
      highlighted: true,
      disabled: currentPlan === "BARBER",
    },
    {
      id: "PREMIUM",
      name: "Plano Premium",
      price: initialPrices?.premium ? initialPrices.premium.toString() : "297",
      description:
        "A experiência definitiva de elite com pagamentos online, PDV e marketing para dominar o mercado.",
      features: [
        "Pagamentos Online (Stripe)",
        "PDV & Frente de Caixa",
        "Gestão de Estoque",
        "Marketing p/ Clientes",
        "Suporte VIP 24h",
      ],
      cta:
        currentPlan === "PREMIUM" ? "Seu Plano Atual" : "Assinar Plano Premium",
      highlighted: false,
      disabled: currentPlan === "PREMIUM",
    },
  ]

  return (
    <div className="mx-[-1.5rem] grid snap-x snap-mandatory auto-cols-[250px] grid-flow-col items-stretch gap-3 overflow-x-auto px-6 pb-10 md:mx-0 md:auto-cols-auto md:grid-flow-row md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
      {plans.map((plan, index) => (
        <div
          key={index}
          className={`relative flex h-full snap-center flex-col rounded-2xl border p-6 transition-all duration-500 md:rounded-3xl md:p-8 md:hover:scale-[1.02] ${plan.highlighted ? "border-[#2C78B2] bg-[#1A1A1A] shadow-2xl shadow-[#2C78B2]/10" : "border-white/5 bg-[#151515] hover:border-white/10"}`}
        >
          {plan.highlighted && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2C78B2] px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white md:-top-4 md:px-4 md:py-1 md:text-[10px]">
              Mais Popular
            </div>
          )}
          <div className="mb-6 md:mb-8">
            <h3 className="mb-1 text-lg font-bold text-white md:mb-2 md:text-xl">
              {plan.name}
            </h3>
            <p className="text-xs leading-relaxed text-gray-400 md:text-sm">
              {plan.description}
            </p>
          </div>
          <div className="mb-6 flex items-baseline md:mb-8">
            <span className="mr-1 text-base text-gray-400 md:text-lg">R$</span>
            <span className="text-3xl font-extrabold text-white md:text-4xl">
              {plan.price}
            </span>
            <span className="ml-2 text-xs text-gray-500 md:text-sm">/mês</span>
          </div>
          <Button
            onClick={() => handleSubscribe(plan.name)}
            disabled={plan.disabled}
            className={`mb-8 w-full rounded-xl py-5 text-xs font-bold transition-all md:mb-10 md:py-6 md:text-sm ${plan.highlighted ? "bg-[#2C78B2] text-white shadow-xl shadow-[#2C78B2]/20 hover:bg-[#1E5A8A]" : "border border-white/10 bg-white/5 text-white hover:bg-white/10"}`}
          >
            {plan.cta}
            {!plan.disabled && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
          <ul className="flex-1 space-y-3 md:space-y-4">
            {plan.features.map((feature, fIndex) => (
              <li
                key={fIndex}
                className="flex items-center gap-3 text-xs text-gray-400 md:text-sm"
              >
                <div
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full md:h-5 md:w-5 ${plan.highlighted ? "bg-[#2C78B2]/20 text-[#2C78B2]" : "bg-white/5 text-gray-500"}`}
                >
                  <Check size={10} className="md:size-[12px]" />
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default PricingCards
