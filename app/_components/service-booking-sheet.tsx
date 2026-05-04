"use client"

import { setHours, setMinutes, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet"
import { Button } from "./ui/button"
import { Calendar } from "./ui/calendar"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useAuth } from "../_providers/auth"
import { getAvailableSlots } from "../_actions/get-available-slots"
import {
  getOperatingDays,
  getOperatingExceptions,
} from "../_actions/get-operating-settings"
import { cn } from "@/app/_lib/utils"
import PaymentCheckoutDialog from "./payment-checkout-dialog"
import { getAvailableBarbers } from "../_actions/get-available-barbers"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { UserIcon } from "lucide-react"

interface ServiceBookingSheetProps {
  service: {
    id: string
    name: string
    description: string
    imageUrl: string
    price: number
    barbershopId: string
  }
  isOpen: boolean
  onClose: () => void
}

const ServiceBookingSheet = ({
  service,
  isOpen,
  onClose,
}: ServiceBookingSheetProps) => {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [hour, setHour] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [loadingBarbers, setLoadingBarbers] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [operatingDays, setOperatingDays] = useState<any[]>([])
  const [exceptions, setExceptions] = useState<any[]>([])
  const [slotsCache, setSlotsCache] = useState<Record<string, string[]>>({})
  const [availableBarbers, setAvailableBarbers] = useState<any[]>([])
  const [selectedBarberId, setSelectedBarberId] = useState<string | undefined>(
    undefined,
  )

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentData, setPaymentData] = useState<{
    amount: number
    serviceName: string
    itemId: string
    type: "SERVICE" | "PRODUCT"
    metadata?: any
    bookingId?: string
    barbershopId?: string
  } | null>(null)

  // Fetch operating settings once when component opens
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [days, currentExceptions] = await Promise.all([
            getOperatingDays(service.barbershopId),
            getOperatingExceptions(service.barbershopId),
          ])
          setOperatingDays(days)
          setExceptions(currentExceptions)
        } catch (error) {
          console.error("Erro ao carregar dados iniciais:", error)
        }
      }
      fetchData()
    } else {
      setSelectedDate(undefined)
      setHour(undefined)
      setSelectedBarberId(undefined)
      setAvailableSlots([])
      setAvailableBarbers([])
      setSlotsCache({})
    }
  }, [isOpen, service.barbershopId])

  // Fetch slots when date changes
  useEffect(() => {
    if (!selectedDate) return
    const dateKey = selectedDate.toDateString()

    if (slotsCache[dateKey]) {
      setAvailableSlots(slotsCache[dateKey])
      return
    }

    const fetchBookings = async () => {
      setLoading(true)
      try {
        const slots = await getAvailableSlots({
          date: selectedDate,
          barbershopId: service.barbershopId,
        })
        setAvailableSlots(slots)
        setSlotsCache((prev) => ({ ...prev, [dateKey]: slots }))
      } catch (error) {
        console.error("Erro ao carregar horários:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [selectedDate, slotsCache, service.barbershopId])

  // Fetch available barbers when hour changes
  useEffect(() => {
    if (!selectedDate || !hour) {
      setAvailableBarbers([])
      setSelectedBarberId(undefined)
      return
    }

    const fetchBarbers = async () => {
      setLoadingBarbers(true)
      try {
        const [hours, minutes] = hour.split(":").map(Number)
        const bookingDate = setHours(setMinutes(selectedDate, minutes), hours)

        const barbers = await getAvailableBarbers({
          date: bookingDate,
          barbershopId: service.barbershopId,
        })
        setAvailableBarbers(barbers)

        // Auto-select if only one barber is available
        if (barbers.length === 1) {
          setSelectedBarberId(barbers[0].id)
        }
      } catch (error) {
        console.error("Erro ao carregar barbeiros disponíveis:", error)
      } finally {
        setLoadingBarbers(false)
      }
    }

    fetchBarbers()
  }, [hour, selectedDate, service.barbershopId])

  const handleBooking = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para agendar.")
      return
    }

    if (!selectedDate || !hour || !selectedBarberId) {
      toast.error("Por favor, selecione data, horário e o profissional.")
      return
    }

    try {
      setLoading(true)

      const [hours, minutes] = hour.split(":").map(Number)
      const bookingDate = setHours(setMinutes(selectedDate, minutes), hours)

      const response = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          itemId: service.id,
          type: "SERVICE",
          metadata: {
            date: bookingDate.toISOString(),
            barberId: selectedBarberId,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao processar agendamento")
      }

      const checkoutResponse = await response.json()

      // Se for Mercado Pago ou Mock, abrimos nosso modal profissional
      if (checkoutResponse.action === "OPEN_MODAL" || checkoutResponse.isMock) {
        setPaymentData({
          amount: Number(checkoutResponse.amount),
          serviceName: checkoutResponse.name,
          itemId: service.id,
          type: "SERVICE",
          metadata: {
            date: bookingDate.toISOString(),
            barberId: selectedBarberId,
          },
          bookingId: checkoutResponse.bookingId || "",
          barbershopId: service.barbershopId,
        })
        setIsPaymentModalOpen(true)
        return
      }

      const { url } = checkoutResponse
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Error initiating checkout:", error)
      toast.error("Erro ao iniciar pagamento. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const isDateDisabled = (date: Date) => {
    const normalizedDate = startOfDay(date)
    const today = startOfDay(new Date())

    if (normalizedDate < today) return true

    const exception = exceptions.find(
      (e) =>
        startOfDay(new Date(e.date)).getTime() === normalizedDate.getTime(),
    )
    if (exception) return !exception.isOpen

    const dayOfWeek = date.getDay()
    const standardDay = operatingDays.find((d) => d.dayOfWeek === dayOfWeek)
    if (standardDay) return !standardDay.isOpen

    return false
  }

  return (
    <div className="sheet-wrapper">
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[90%] overflow-y-auto border-white/10 bg-[#121212] sm:w-[400px]">
          <SheetHeader className="border-b border-solid border-secondary px-5 py-6 text-left">
            <SheetTitle>Agendar {service.name}</SheetTitle>
            <SheetDescription>
              Escolha a data, o horário e o profissional desejado.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* 1. SELECIONAR DATA */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-white">
                1. Selecione a data
              </h3>
              <div className="calendar-container">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date)
                    setHour(undefined)
                  }}
                  disabled={isDateDisabled}
                  locale={ptBR}
                  fromDate={new Date()}
                  classNames={{
                    day_selected:
                      "bg-[#3EABFD] text-white hover:bg-[#3EABFD] hover:text-white rounded-xl",
                    day_disabled: "text-gray-600 opacity-20 cursor-not-allowed",
                    day_today: "bg-white/5 text-[#3EABFD] font-bold",
                  }}
                />
              </div>
            </div>

            {/* 2. SELECIONAR HORÁRIO */}
            {selectedDate && (
              <div className="min-h-[150px] space-y-2">
                <h3 className="text-sm font-semibold text-white">
                  2. Selecione o horário
                </h3>
                {loading && availableSlots.length === 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="h-9 w-full animate-pulse rounded-xl bg-white/5"
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "grid grid-cols-3 gap-2 text-white transition-opacity",
                      loading ? "opacity-50" : "opacity-100",
                    )}
                  >
                    {availableSlots.map((time) => {
                      const [hours, minutes] = time.split(":").map(Number)
                      const dateTime = setHours(
                        setMinutes(selectedDate, minutes),
                        hours,
                      )

                      const isPastTime =
                        selectedDate.toDateString() ===
                          new Date().toDateString() && dateTime < new Date()

                      return (
                        <Button
                          key={time}
                          variant={hour === time ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setHour(time)
                            setSelectedBarberId(undefined)
                          }}
                          disabled={isPastTime}
                          className={cn(
                            "rounded-xl text-xs text-white transition-all",
                            hour === time
                              ? "border-[#3EABFD] bg-[#3EABFD]"
                              : "border-white/10 bg-transparent hover:bg-white/5",
                          )}
                        >
                          {time}
                        </Button>
                      )
                    })}
                    {availableSlots.length === 0 && !loading && (
                      <p className="col-span-3 py-4 text-center text-xs text-gray-400">
                        Não há horários disponíveis para esta data.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. SELECIONAR PROFISSIONAL */}
            {selectedDate && hour && (
              <div className="duration-300 animate-in fade-in slide-in-from-top-2">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  3. Escolha o profissional disponível
                </h3>
                {loadingBarbers ? (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-16 w-16 animate-pulse rounded-full bg-white/5"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto px-2 py-2 [&::-webkit-scrollbar]:hidden">
                    {availableBarbers.map((barber) => (
                      <div
                        key={barber.id}
                        className="flex flex-col items-center gap-2"
                      >
                        <button
                          onClick={() => setSelectedBarberId(barber.id)}
                          className={cn(
                            "relative h-16 w-16 rounded-full transition-all",
                            selectedBarberId === barber.id
                              ? "ring-2 ring-[#3EABFD] ring-offset-2 ring-offset-[#121212]"
                              : "opacity-60 grayscale hover:opacity-100 hover:grayscale-0",
                          )}
                        >
                          <Avatar className="h-full w-full">
                            <AvatarImage
                              src={barber.imageUrl}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-[#222]">
                              <UserIcon className="h-8 w-8 text-gray-400" />
                            </AvatarFallback>
                          </Avatar>
                          {selectedBarberId === barber.id && (
                            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#3EABFD] p-1 shadow-md">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          )}
                        </button>
                        <span
                          className={cn(
                            "text-[10px] font-medium transition-colors",
                            selectedBarberId === barber.id
                              ? "text-[#3EABFD]"
                              : "text-gray-400",
                          )}
                        >
                          {barber.name.split(" ")[0]}
                        </span>
                      </div>
                    ))}
                    {availableBarbers.length === 0 && (
                      <p className="py-2 text-xs text-gray-400">
                        Nenhum barbeiro disponível para este horário.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full rounded-xl bg-[#3EABFD] text-white hover:bg-[#2e8acb]"
              onClick={handleBooking}
              disabled={
                (user && (!selectedDate || !hour || !selectedBarberId)) ||
                loading ||
                loadingBarbers
              }
            >
              {loading && !selectedDate
                ? "Carregando..."
                : user
                  ? `Agendar ${service.name.toLowerCase()}`
                  : "Você precisa estar logado para agendar"}
            </Button>
          </div>
        </SheetContent>

        <PaymentCheckoutDialog
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={() => {
            setIsPaymentModalOpen(false)
            onClose()
          }}
          amount={paymentData?.amount || 0}
          serviceName={paymentData?.serviceName || ""}
          itemId={paymentData?.itemId || ""}
          type={paymentData?.type || "SERVICE"}
          metadata={paymentData?.metadata}
          bookingId={paymentData?.bookingId || ""}
          barbershopId={paymentData?.barbershopId || service.barbershopId}
        />
      </Sheet>
    </div>
  )
}

export default ServiceBookingSheet
