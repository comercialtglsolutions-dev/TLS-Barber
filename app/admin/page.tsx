import { createClient } from "../_lib/supabase/server"
import { db } from "../_lib/prisma"
import { redirect } from "next/navigation"
import { getAdminSummary } from "../_data/get-admin-summary"
import Header from "../_components/header"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../_components/ui/card"
import { Badge } from "../_components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, PackageIcon, ScissorsIcon } from "lucide-react"
import ManagementTabs from "./_components/management-tabs"
import ManualBookingDialog from "./_components/manual-booking-dialog"
import ManualSaleDialog from "./_components/manual-sale-dialog"
import DeleteBookingButton from "./_components/delete-booking-button"
import DeletePurchaseButton from "./_components/delete-purchase-button"
import { getBanks } from "../_actions/get-banks"
import ConfirmPixButton from "./_components/confirm-pix-button"

const AdminPage = async () => {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return redirect("/")
  }

  const user = await db.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true, subscriptionPlan: true },
  })

  if (user?.role !== "ADMIN") {
    return redirect("/")
  }

  const {
    bookings,
    purchases,
    services,
    products,
    combos,
    users,
    settings,
    operatingDays,
    operatingExceptions,
    barbers,
  } = await getAdminSummary()

  const banks = await getBanks()

  const totalRevenue =
    bookings.reduce(
      (acc: number, booking: any) =>
        acc + Number(booking.service?.price || booking.combo?.price || 0),
      0,
    ) +
    purchases.reduce(
      (acc: number, purchase: any) =>
        acc + Number(purchase.product.price) * purchase.quantity,
      0,
    )

  return (
    <div className="flex flex-col gap-6 pb-10">
      <Header />

      <div className="container mx-auto px-5 py-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
          <h1 className="text-[clamp(1.25rem,5vw,1.5rem)] font-bold text-white lg:text-2xl">
            Painel administrativo
          </h1>
          <div className="flex flex-row gap-3 lg:gap-4">
            <div className="flex-1">
              <ManualSaleDialog users={users} products={products} />
            </div>
            <div className="flex-1">
              <ManualBookingDialog
                users={users}
                services={services}
                combos={combos}
              />
            </div>
          </div>
        </div>

        <ManagementTabs
          services={services}
          products={products}
          combos={combos}
          subscriptionPlan={user.subscriptionPlan as any}
          settings={
            settings ||
            ({
              id: "",
              name: "",
              address: "",
              phones: [],
              description: "",
              imageUrl: "",
              startHour: "",
              endHour: "",
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any)
          }
          operatingDays={operatingDays}
          operatingExceptions={operatingExceptions}
          banks={banks}
          barbers={barbers}
        >
          <div className="flex flex-col gap-8">
            {/* METRICS */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              <Card className="border-white/10 bg-[#1A1A1A]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 lg:p-6 lg:pb-2">
                  <CardTitle className="text-[10px] font-medium text-gray-400 lg:text-sm">
                    Agendamentos
                  </CardTitle>
                  <CalendarIcon className="h-3 w-3 text-[#3EABFD] lg:h-4 lg:w-4" />
                </CardHeader>
                <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
                  <div className="text-lg font-bold text-white lg:text-2xl">
                    {bookings.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-[#1A1A1A]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 lg:p-6 lg:pb-2">
                  <CardTitle className="text-[10px] font-medium text-gray-400 lg:text-sm">
                    Vendas
                  </CardTitle>
                  <PackageIcon className="h-3 w-3 text-[#3EABFD] lg:h-4 lg:w-4" />
                </CardHeader>
                <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
                  <div className="text-lg font-bold text-white lg:text-2xl">
                    {purchases.reduce(
                      (acc: number, p: any) => acc + p.quantity,
                      0,
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-[#1A1A1A]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 lg:p-6 lg:pb-2">
                  <CardTitle className="text-[10px] font-medium text-gray-400 lg:text-sm">
                    Serviços
                  </CardTitle>
                  <ScissorsIcon className="h-3 w-3 text-[#3EABFD] lg:h-4 lg:w-4" />
                </CardHeader>
                <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
                  <div className="text-lg font-bold text-white lg:text-2xl">
                    {services.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-[#1A1A1A]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 lg:p-6 lg:pb-2">
                  <CardTitle className="text-[10px] font-medium text-gray-400 lg:text-sm">
                    Receita
                  </CardTitle>
                  <span className="text-xs font-bold text-[#3EABFD] lg:text-base">
                    R$
                  </span>
                </CardHeader>
                <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
                  <div className="truncate text-lg font-bold text-white lg:text-2xl">
                    {totalRevenue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RECENT DATA */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-white/10 bg-[#1A1A1A]">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white">
                    Últimos agendamentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {bookings.slice(0, 5).map((booking: any) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-[#222] p-2 lg:p-3"
                    >
                      <div className="flex min-w-0 flex-1 flex-col pr-2">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-bold text-white lg:text-sm">
                            {booking.user.name}
                          </span>
                          {booking.paymentStatus === "PENDING_VERIFICATION" && (
                            <Badge className="bg-yellow-500/20 text-[8px] text-yellow-500 hover:bg-yellow-500/20 lg:text-[10px]">
                              Aguardando Pix
                            </Badge>
                          )}
                        </div>
                        <span className="truncate text-[10px] text-gray-400 lg:text-xs">
                          {booking.service?.name ||
                            booking.combo?.name ||
                            "Sem descrição"}
                        </span>
                        <div className="mt-1 lg:hidden">
                          {booking.paymentStatus === "PENDING_VERIFICATION" ? (
                            <ConfirmPixButton bookingId={booking.id} />
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-green-500 px-1 py-0 text-[8px] text-green-500"
                            >
                              Confirmado
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 lg:gap-6">
                        <div className="flex flex-col items-end lg:flex-row lg:items-center lg:gap-5">
                          <div className="hidden items-center gap-4 lg:flex">
                            <span className="text-sm text-white">
                              {format(booking.date, "dd/MM", {
                                locale: ptBR,
                              })}
                            </span>
                            <span className="text-sm text-white">
                              {format(booking.date, "HH:mm", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>

                          <span className="text-xs font-bold text-white lg:text-sm">
                            R${" "}
                            {Number(
                              booking.service?.price ||
                                booking.combo?.price ||
                                0,
                            ).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </span>

                          <div className="hidden lg:flex">
                            {booking.paymentStatus ===
                            "PENDING_VERIFICATION" ? (
                              <ConfirmPixButton bookingId={booking.id} />
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-green-500 text-[10px] text-green-500"
                              >
                                Confirmado
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-gray-400 lg:hidden">
                            <span>
                              {format(booking.date, "dd/MM", {
                                locale: ptBR,
                              })}
                            </span>
                            <span>
                              {format(booking.date, "HH:mm", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                        <DeleteBookingButton bookingId={booking.id} />
                      </div>
                    </div>
                  ))}
                  {bookings.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Nenhum agendamento encontrado.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-[#1A1A1A]">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white">
                    Vendas recentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {purchases.slice(0, 5).map((purchase: any) => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-[#222] p-2 lg:p-3"
                    >
                      <div className="flex min-w-0 flex-1 flex-col pr-2">
                        <span className="truncate text-xs font-bold text-white lg:text-sm">
                          {purchase.user.name}
                        </span>
                        <span className="truncate text-[10px] text-gray-400 lg:text-xs">
                          {purchase.product.name} ({purchase.quantity}x)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 lg:gap-6">
                        <div className="flex flex-col items-end lg:flex-row lg:items-center lg:gap-5">
                          <div className="hidden items-center gap-4 lg:flex">
                            <span className="text-sm text-white">
                              {format(purchase.createdAt, "dd/MM", {
                                locale: ptBR,
                              })}
                            </span>
                            <span className="text-sm text-white">
                              {format(purchase.createdAt, "HH:mm", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>

                          <span className="text-xs font-bold text-white lg:text-sm">
                            R${" "}
                            {(
                              Number(purchase.product.price) * purchase.quantity
                            ).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </span>

                          <div className="flex items-center gap-1 text-[10px] text-gray-400 lg:hidden">
                            <span>
                              {format(purchase.createdAt, "dd/MM", {
                                locale: ptBR,
                              })}
                            </span>
                            <span>
                              {format(purchase.createdAt, "HH:mm", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                        <DeletePurchaseButton purchaseId={purchase.id} />
                      </div>
                    </div>
                  ))}
                  {purchases.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Nenhuma venda encontrada.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </ManagementTabs>
      </div>
    </div>
  )
}

export default AdminPage
