"use client"

import { Prisma } from "@prisma/client"
import { Avatar, AvatarImage } from "./ui/avatar"
import { Badge } from "./ui/badge"
import { Card, CardContent } from "./ui/card"
import { format, isFuture } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet"
import Image from "next/image"
import PhoneItem from "./phone-item"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { DialogClose } from "@radix-ui/react-dialog"
import { deleteBooking } from "../_actions/delete-bookings"
import { toast } from "sonner"
import { useState } from "react"
import BookingSummary from "./booking-summary"
import { useAuth } from "../_providers/auth"
import { cn } from "@/app/_lib/utils"

interface BookingItemProps {
  booking: Prisma.BookingGetPayload<{
    include: {
      service: true
      combo: true
      barbershop: {
        include: {
          settings: true
        }
      }
    }
  }>
  settings?: any
}

const BookingItem = ({ booking, settings }: BookingItemProps) => {
  const { profile } = useAuth()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const barbershop =
    booking.barbershop?.settings ||
    (settings
      ? {
          name: settings.name,
          address: settings.address,
          imageUrl: settings.imageUrl,
          phones: settings.phones || [],
        }
      : {
          name: "GB Barbearia",
          address: "Rua das Doninhas, 253 - Cotia, SP",
          imageUrl: "/Logo-GB.jpeg",
          phones: ["(11) 99999-9999"],
        })

  const isConfirmed =
    isFuture(booking.date) && (booking.paymentStatus as string) === "SUCCEEDED"
  const isPendingPix =
    isFuture(booking.date) &&
    (booking.paymentStatus as string) === "PENDING_VERIFICATION"

  const handleCancelBooking = async () => {
    try {
      await deleteBooking(booking.id)
      setIsSheetOpen(false)
      toast.success("Reserva cancelada com sucesso!")
    } catch (error) {
      console.error(error)
      toast.error("Erro ao cancelar reserva. Tente novamente.")
    }
  }

  const handleSheetOpenChange = (isOpen: boolean) => {
    setIsSheetOpen(isOpen)
  }

  const isAdmin = profile?.role === "ADMIN"

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger className="w-full min-w-[calc(100vw-60px)] rounded-xl border-white bg-[#3EABFD] lg:min-w-[450px] lg:max-w-[450px]">
        <Card className="w-full min-w-[calc(100vw-60px)] lg:min-w-[450px] lg:max-w-[450px]">
          <CardContent className="flex justify-between p-0">
            <div className="flex flex-col gap-2 py-5 pl-5">
              <Badge
                className={cn(
                  "w-fit",
                  isConfirmed && "border-[#22c55e] text-[#22c55e]",
                  isPendingPix && "border-yellow-500 text-yellow-500",
                  !isConfirmed &&
                    !isPendingPix &&
                    "border-gray-400 text-gray-400",
                )}
                variant="outline"
              >
                {isConfirmed
                  ? "Confirmado"
                  : isPendingPix
                    ? "Aguardando Pix"
                    : "Finalizado"}
              </Badge>
              <h3 className="font-semibold text-white">
                {booking.service?.name ||
                  (booking as any).combo?.name ||
                  "Sem descrição"}
              </h3>

              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={barbershop.imageUrl} />
                </Avatar>
                <p className="text-sm text-white">{barbershop.name}</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center border-l-2 border-solid px-5">
              <p className="text-sm capitalize text-white">
                {format(booking.date, "MMMM", { locale: ptBR })}
              </p>
              <p className="text-2xl text-white">
                {format(booking.date, "dd", { locale: ptBR })}
              </p>
              <p className="text-sm text-white">
                {format(booking.date, "HH:mm", { locale: ptBR })}
              </p>
            </div>
          </CardContent>
        </Card>
      </SheetTrigger>
      <SheetContent className="w-[85%] bg-[#121212] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-left text-white">
            Informações da Reserva
          </SheetTitle>
        </SheetHeader>

        <div className="relative mt-6 flex h-[180px] w-full items-end">
          <Image
            alt={`Mapa da barbearia ${barbershop.name}`}
            src="/map.svg"
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="rounded-xl object-cover"
          />

          <Card className="z-50 mx-5 mb-3 w-full rounded-xl">
            <CardContent className="flex items-center gap-3 rounded-xl border border-white px-5 py-3">
              <Avatar>
                <AvatarImage src={barbershop.imageUrl} />
              </Avatar>
              <div>
                <h3 className="font-bold text-white">{barbershop.name}</h3>
                <p className="text-xs text-white">{barbershop.address}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <div className="mb-3 mt-6 text-white">
            <BookingSummary
              barbershop={barbershop}
              service={
                {
                  ...(booking.service || (booking as any).combo),
                  paymentStatus: booking.paymentStatus,
                } as any
              }
              selectedDate={booking.date}
              isConfirmed={isConfirmed}
              isPendingPix={isPendingPix}
            />
          </div>

          <div className="space-y-3 text-white">
            {barbershop.phones.map((phone: string, index: number) => (
              <PhoneItem key={index} phone={phone} />
            ))}
          </div>
        </div>
        <SheetFooter className="mt-6">
          <div className="flex items-center gap-3">
            <SheetClose asChild>
              <Button className="w-full rounded-xl border border-white text-white">
                Voltar
              </Button>
            </SheetClose>
            {isConfirmed && isAdmin && (
              <Dialog>
                <DialogTrigger className="w-full rounded-xl border border-red-500">
                  <Button variant="destructive" className="w-full text-white">
                    Cancelar Reserva
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[90%] bg-[#1D1D1D] text-white">
                  <DialogHeader>
                    <DialogTitle>Você deseja cancelar sua reserva?</DialogTitle>
                    <DialogDescription>
                      Ao cancelar, você perderá sua reserva e não poderá
                      recuperá-la. Essa ação é irreversível.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex flex-row gap-3">
                    <DialogClose asChild>
                      <Button variant="outline" className="w-full rounded-xl">
                        Voltar
                      </Button>
                    </DialogClose>
                    <DialogClose className="w-full rounded-xl">
                      <Button
                        onClick={handleCancelBooking}
                        className="w-full rounded-xl border border-red-500 bg-red-500 text-white"
                      >
                        Confirmar
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default BookingItem
