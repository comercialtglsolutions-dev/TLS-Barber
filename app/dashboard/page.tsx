import Header from "../_components/header"

import { Button } from "../_components/ui/button"
import Image from "next/image"
import { db } from "../_lib/prisma"
import ProductItem from "../_components/product-item"
import { quickSearchOptions } from "../_constants/search"
import BookingItem from "../_components/booking-item"
import Search from "../_components/search"
import Link from "next/link"
import { createClient } from "../_lib/supabase/server"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getConfirmedBookings } from "../_data/get-confirmed-bookings"
import ServiceItem from "../_components/service-item"
import ScrollableContainer from "../_components/scrollable-container"
import CombinedServiceItem from "../_components/combined-service-item"
import { redirect } from "next/navigation"
import BarbershopBadge from "../_components/barbershop-badge"
import BarbershopSelector from "../_components/barbershop-selector"

export const dynamic = "force-dynamic"

const Dashboard = async ({
  searchParams,
}: {
  searchParams: { barbershopId?: string }
}) => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return redirect("/")
  }

  const user = await db.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      name: true,
      subscriptionPlan: true,
      trialEndsAt: true,
      role: true,
      barbershopId: true,
    },
  })

  if (!user) {
    return redirect("/")
  }

  const isTrial = user.subscriptionPlan === "FREE"
  const isTrialExpired =
    isTrial && user.trialEndsAt && new Date() > user.trialEndsAt

  if (isTrialExpired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] p-6 text-center">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111111] p-10 shadow-2xl">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-[#2C78B2]/10">
            <Image
              src="/Logo.svg"
              alt="TLS Barber"
              width={40}
              height={40}
              className="opacity-50"
            />
          </div>
          <h2 className="mb-4 text-3xl font-bold text-white">
            Teste Gratuito Encerrado
          </h2>
          <p className="mb-10 leading-relaxed text-gray-400">
            Seus 15 dias de teste chegaram ao fim. Para continuar gerenciando
            sua barbearia e acessando seus dados, escolha um plano profissional.
          </p>
          <div className="flex flex-col gap-4">
            <Button
              className="h-14 w-full rounded-2xl bg-[#2C78B2] font-bold text-white shadow-xl transition-all hover:bg-[#1E5A8A]"
              asChild
            >
              <Link href="/#plans">Ver Planos de Assinatura</Link>
            </Button>
            <Button
              variant="ghost"
              className="text-gray-500 hover:text-white"
              asChild
            >
              <Link href="/">Voltar para Início</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const finalBarbershopId = searchParams.barbershopId || user.barbershopId

  if (!finalBarbershopId) {
    const barbershops = await db.barbershop.findMany({
      include: {
        settings: true,
        operatingDays: true,
      },
    })

    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <Header />
        <BarbershopSelector
          barbershops={JSON.parse(JSON.stringify(barbershops))}
        />
      </div>
    )
  }

  const popularProducts = await db.product.findMany({
    where: { barbershopId: finalBarbershopId },
    take: 10,
  })
  const popularServices = await db.service.findMany({
    where: { barbershopId: finalBarbershopId },
    take: 10,
  })

  const currentBarbershop = await db.barbershop.findUnique({
    where: { id: finalBarbershopId },
  })

  const combos = await (db as any).combo.findMany({
    where: { barbershopId: finalBarbershopId },
    include: {
      service1: true,
      service2: true,
    },
  })

  const recommendedServicePairs = combos.map((combo: any) => ({
    id: combo.id,
    name: combo.name,
    description: combo.description,
    imageUrl: combo.imageUrl,
    price: Number(combo.price),
    barbershopId: combo.barbershopId,
    services: [
      { ...combo.service1, price: Number(combo.service1.price) },
      { ...combo.service2, price: Number(combo.service2.price) },
    ],
  }))

  const confirmedBookings = await getConfirmedBookings()
  const settings = await db.settings.findUnique({
    where: { barbershopId: finalBarbershopId },
  })

  return (
    <div>
      <Header />
      <div className="p-5 lg:ml-32 lg:mt-[-80px] lg:p-[150px]">
        <div className="mt-2 lg:flex lg:gap-10">
          <div className="flex-shrink-0 lg:w-[480px]">
            <div>
              <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-medium text-white">
                    Olá, {user.name || "bem vindo"}!
                  </h2>
                  <p className="text-xs lg:text-sm">
                    <span className="capitalize text-white">
                      {format(new Date(), "EEEE, dd", { locale: ptBR })}
                    </span>
                    <span className="text-white">&nbsp;de&nbsp;</span>
                    <span className="capitalize text-white">
                      {format(new Date(), "MMMM", { locale: ptBR })}
                    </span>
                  </p>
                </div>

                {user.role !== "ADMIN" && (
                  <BarbershopBadge
                    name={currentBarbershop?.name || "Unidade Selecionada"}
                    address={settings?.address || ""}
                  />
                )}
              </div>

              <div className="mt-6">
                <Search />
              </div>

              <div className="mt-6 flex gap-3 overflow-x-scroll lg:hidden [&::-webkit-scrollbar]:hidden">
                {quickSearchOptions.map((option) => (
                  <Button
                    className="gap-2"
                    variant="secondary"
                    key={option.title}
                    asChild
                  >
                    <Link href={`/barbershops?service=${option.title}`}>
                      <Image
                        src={option.imageUrl}
                        width={16}
                        height={16}
                        alt={option.title}
                      />
                      {option.title}
                    </Link>
                  </Button>
                ))}
              </div>

              <div className="relative mt-6 h-[150px] w-full lg:mt-6 lg:h-[220px] lg:w-full">
                <Image
                  alt="Agende nos melhores com TLS Barber"
                  src="/Banner-01.svg"
                  fill
                  className="rounded-xl object-cover"
                />
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-white lg:mt-[-24px]">
              Recomendados
            </h2>
            <ScrollableContainer maxW="lg:max-w-[872px]">
              {recommendedServicePairs.map((servicePair: any) => (
                <CombinedServiceItem
                  key={servicePair.id}
                  service={servicePair}
                />
              ))}
            </ScrollableContainer>
          </div>
        </div>

        {confirmedBookings.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 text-xs font-bold uppercase text-white">
              Agendamentos
            </h2>
            <ScrollableContainer maxW="lg:max-w-[1391px]">
              {confirmedBookings.map((booking) => (
                <BookingItem
                  key={booking.id}
                  booking={JSON.parse(JSON.stringify(booking))}
                  settings={JSON.parse(JSON.stringify(settings))}
                />
              ))}
            </ScrollableContainer>
          </div>
        )}

        <h2 className="mb-3 mt-6 flex items-center justify-between text-xs font-bold uppercase text-white">
          Serviços populares
        </h2>
        <ScrollableContainer maxW="lg:max-w-[1391px]">
          {popularServices.map((service: any) => (
            <ServiceItem
              key={service.id}
              service={JSON.parse(
                JSON.stringify({
                  ...service,
                  price: Number(service.price),
                }),
              )}
            />
          ))}
        </ScrollableContainer>

        <h2 className="mb-3 mt-10 text-xs font-bold uppercase text-white">
          Produtos mais vendidos
        </h2>
        <ScrollableContainer maxW="lg:max-w-[1391px]">
          {popularProducts.map((product: any) => (
            <ProductItem
              key={product.id}
              product={JSON.parse(
                JSON.stringify({
                  ...product,
                  price: Number(product.price),
                }),
              )}
            />
          ))}
        </ScrollableContainer>
      </div>
    </div>
  )
}

export default Dashboard
