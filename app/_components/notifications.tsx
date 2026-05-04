"use client"

import {
  BellIcon,
  CalendarIcon,
  PackageIcon,
  Volume2Icon,
  VolumeXIcon,
  BanknoteIcon,
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
} from "lucide-react"
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { useEffect, useState, useRef } from "react"
import { getNotifications } from "../_actions/get-notifications"
import { verifyPixPayment } from "../_actions/verify-pix-payment"
import { useAuth } from "../_providers/auth"
import { formatDistanceToNow, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

const Notifications = () => {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<{
    bookings: any[]
    purchases: any[]
    pendingPixPayments: any[]
  }>({
    bookings: [],
    purchases: [],
    pendingPixPayments: [],
  })
  const [hasNew, setHasNew] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const lastNotifiedIdRef = useRef<string | null>(null)
  const soundEnabledRef = useRef(true)

  const isAdmin = profile?.role === "ADMIN"

  // Carregar preferência de som
  useEffect(() => {
    const saved = localStorage.getItem("notificationSoundEnabled")
    if (saved !== null) {
      const isEnabled = saved === "true"
      setSoundEnabled(isEnabled)
      soundEnabledRef.current = isEnabled
    }
  }, [])

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    soundEnabledRef.current = newValue
    localStorage.setItem("notificationSoundEnabled", String(newValue))
  }

  const triggerNotificationSound = (type: "booking" | "purchase" | "pix") => {
    if (!soundEnabledRef.current) return

    const audioFile =
      type === "purchase"
        ? "/sounds/sale.mp3"
        : type === "pix"
          ? "/sounds/sale.mp3"
          : "/sounds/appointments.mp3"

    const audio = new Audio(audioFile)

    audio.play().catch(() => {
      try {
        const AudioContextClass =
          (window as any).AudioContext || (window as any).webkitAudioContext
        if (!AudioContextClass) return

        const context = new AudioContextClass()
        const osc = context.createOscillator()
        const gain = context.createGain()

        osc.connect(gain)
        gain.connect(context.destination)

        osc.start()
        osc.stop(context.currentTime + 0.6)
      } catch (e) {
        // Silently fail
      }
    })
  }

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications()
      setNotifications(response)

      // Detectar Pix pendente novo
      if (response.pendingPixPayments.length > 0) {
        const mostRecentPix = response.pendingPixPayments[0]
        const lastPixId = localStorage.getItem("lastNotifiedPixId")
        if (lastPixId !== mostRecentPix.id) {
          const isFresh =
            new Date().getTime() - new Date(mostRecentPix.updatedAt).getTime() <
            60000
          if (isFresh && lastPixId !== null) {
            triggerNotificationSound("pix")
          }
          localStorage.setItem("lastNotifiedPixId", mostRecentPix.id)
          setHasNew(true)
        }
      }

      const allItems = [
        ...response.bookings.map((b: any) => ({ ...b, type: "booking" })),
        ...response.purchases.map((p: any) => ({ ...p, type: "purchase" })),
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )

      const mostRecent = allItems[0]

      if (mostRecent) {
        if (
          lastNotifiedIdRef.current &&
          lastNotifiedIdRef.current !== mostRecent.id
        ) {
          const isFresh =
            new Date().getTime() - new Date(mostRecent.createdAt).getTime() <
            60000
          if (isFresh) {
            triggerNotificationSound(mostRecent.type as "booking" | "purchase")
            setHasNew(true)
          }
        }
        lastNotifiedIdRef.current = mostRecent.id
      }

      const lastSeen = localStorage.getItem("lastNotificationCheck")
      if (!lastSeen) {
        setHasNew(
          response.bookings.length > 0 ||
            response.purchases.length > 0 ||
            response.pendingPixPayments.length > 0,
        )
      } else {
        const lastCheckTime = new Date(lastSeen).getTime()
        const hasNewItem = allItems.some(
          (item: any) => new Date(item.createdAt).getTime() > lastCheckTime,
        )
        const hasNewPix = response.pendingPixPayments.some(
          (p: any) => new Date(p.updatedAt).getTime() > lastCheckTime,
        )
        setHasNew(hasNewItem || hasNewPix)
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error)
    }
  }

  useEffect(() => {
    if (!isAdmin) return
    fetchNotifications()
    const intervalId = setInterval(fetchNotifications, 30000)
    return () => clearInterval(intervalId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const onPopoverOpenChange = (open: boolean) => {
    if (open) {
      setHasNew(false)
      localStorage.setItem("lastNotificationCheck", new Date().toISOString())
    }
  }

  const handleVerifyPix = async (
    bookingId: string,
    action: "CONFIRM" | "REJECT",
  ) => {
    setVerifyingId(bookingId)
    try {
      await verifyPixPayment(bookingId, action)
      if (action === "CONFIRM") {
        toast.success("Pagamento confirmado! Agendamento marcado como pago.")
      } else {
        toast.error("Pagamento rejeitado. Cliente será notificado.")
      }
      // Atualiza a lista
      await fetchNotifications()
    } catch (error) {
      toast.error("Erro ao processar verificação")
    } finally {
      setVerifyingId(null)
    }
  }

  if (!isAdmin) return null

  const activitiesList = [
    ...notifications.bookings.map((b) => ({ ...b, type: "booking" })),
    ...notifications.purchases.map((p) => ({ ...p, type: "purchase" })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const hasPendingPix = notifications.pendingPixPayments.length > 0
  const totalBadge = hasPendingPix ? notifications.pendingPixPayments.length : 0

  return (
    <Popover onOpenChange={onPopoverOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative mr-2 h-10 w-10 rounded-xl border border-white/10 bg-transparent hover:bg-white/10"
        >
          <BellIcon className="h-5 w-5 text-white" />
          {(hasNew || hasPendingPix) && (
            <span className="absolute right-2 top-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
          )}
          {totalBadge > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
              {totalBadge}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[420px] border-white/10 bg-[#1A1A1A] p-0 text-white"
        align="end"
      >
        <div className="flex items-center justify-between border-b border-white/5 p-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold">Notificações</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => triggerNotificationSound("booking")}
              className="h-6 w-6 p-0 text-gray-600 hover:text-white"
              title="Testar Som"
            >
              <Volume2Icon className="h-3 w-3" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleSound}
            className="h-8 px-2 text-gray-400 hover:bg-white/5"
          >
            {soundEnabled ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-green-500">
                  Som On
                </span>
                <Volume2Icon className="h-4 w-4 text-green-500" />
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-gray-500">
                  Som Off
                </span>
                <VolumeXIcon className="h-4 w-4 text-gray-500" />
              </div>
            )}
          </Button>
        </div>

        <div className="max-h-[480px] overflow-y-auto">
          {/* Seção Pix Pendentes */}
          {hasPendingPix && (
            <div className="border-b border-white/5">
              <div className="flex items-center gap-2 bg-orange-500/10 px-4 py-2">
                <BanknoteIcon className="h-3 w-3 text-orange-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                  Verificar Pix ({notifications.pendingPixPayments.length})
                </span>
              </div>
              {notifications.pendingPixPayments.map((booking: any) => (
                <div
                  key={booking.id}
                  className="border-b border-white/5 bg-orange-500/5 p-4 last:border-0"
                >
                  <div className="mb-3 flex gap-3">
                    <div className="mt-0.5">
                      <BanknoteIcon className="h-4 w-4 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-bold">
                          {booking.user.name || "Cliente"}
                        </span>{" "}
                        reportou pagamento Pix de{" "}
                        <span className="font-bold text-orange-400">
                          R${" "}
                          {Number(
                            booking.service?.price || booking.combo?.price || 0,
                          )
                            .toFixed(2)
                            .replace(".", ",")}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {booking.service?.name || booking.combo?.name} •{" "}
                        {booking.date
                          ? format(new Date(booking.date), "dd/MM HH:mm", {
                              locale: ptBR,
                            })
                          : "—"}
                      </p>
                      <p className="mt-0.5 text-[10px] text-white">
                        Verifique o extrato do seu banco antes de confirmar
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-1 bg-green-600 text-[11px] text-white hover:bg-green-700"
                      onClick={() => handleVerifyPix(booking.id, "CONFIRM")}
                      disabled={verifyingId === booking.id}
                    >
                      {verifyingId === booking.id ? (
                        <Loader2Icon className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2Icon className="h-3 w-3" />
                      )}
                      Confirmar Pix
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 gap-1 border border-red-500/30 text-[11px] text-red-400 hover:bg-red-500/10"
                      onClick={() => handleVerifyPix(booking.id, "REJECT")}
                      disabled={verifyingId === booking.id}
                    >
                      <XCircleIcon className="h-3 w-3" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Atividades Recentes */}
          {activitiesList.length === 0 && !hasPendingPix ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Nenhuma atividade recente.
            </div>
          ) : (
            activitiesList.map((activity: any) => (
              <div
                key={activity.id}
                className="border-b border-white/5 p-4 transition-colors last:border-0 hover:bg-white/5"
              >
                <div className="flex gap-3">
                  <div className="mt-1">
                    {activity.type === "booking" ? (
                      <CalendarIcon className="h-4 w-4 text-blue-400" />
                    ) : (
                      <PackageIcon className="h-4 w-4 text-green-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-bold">
                        {activity.user.name || "Cliente"}
                      </span>
                      {activity.type === "booking" ? (
                        <>
                          {" "}
                          agendou{" "}
                          <span className="text-blue-400">
                            {activity.service?.name || activity.combo?.name}
                          </span>
                        </>
                      ) : (
                        <>
                          {" "}
                          comprou{" "}
                          <span className="text-green-400">
                            {activity.product.name}
                          </span>
                        </>
                      )}
                    </p>
                    <p className="mt-1 text-[10px] text-gray-500">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default Notifications
