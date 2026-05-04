import { format } from "date-fns"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Service } from "@prisma/client"
import { ptBR } from "date-fns/locale"

interface BookingSummaryProps {
  service: Pick<Service, "name" | "price"> | null | undefined
  isConfirmed?: boolean
  isPendingPix?: boolean
  barbershop: {
    name: string
  }
  selectedDate: Date
}

const BookingSummary = ({
  service,
  barbershop,
  selectedDate,
  isConfirmed,
  isPendingPix,
}: BookingSummaryProps) => {
  return (
    <Card className="rounded-xl">
      <CardContent className="space-y-3 p-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">
            {service?.name || "Serviço/Combo removido"}
          </h2>
          <p className="text-sm font-bold">
            {Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(Number(service?.price || 0))}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm text-gray-400">Data</h2>
          <p className="text-sm">
            {format(selectedDate, "d 'de' MMMM", {
              locale: ptBR,
            })}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm text-gray-400">Horário</h2>
          <p className="text-sm">{format(selectedDate, "HH:mm")}</p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm text-gray-400">Barbearia</h2>
          <p className="text-sm">{barbershop.name}</p>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-gray-400">Status</h2>
          <Badge
            className={`w-fit ${
              isConfirmed
                ? "border-[#22c55e] text-[#22c55e]"
                : isPendingPix
                  ? "border-yellow-500 text-yellow-500"
                  : "border-gray-400 text-gray-400"
            }`}
            variant="outline"
          >
            {isConfirmed
              ? "Confirmado"
              : isPendingPix
                ? "Aguardando Pix"
                : "Finalizado"}
          </Badge>
        </div>
        {(service as any)?.paymentStatus && (
          <div className="flex items-center justify-between border-t border-white/5 pt-2">
            <h2 className="text-sm font-semibold italic text-gray-400">
              Pagamento
            </h2>
            <Badge
              className={`w-fit font-black ${(service as any).paymentStatus === "SUCCEEDED" ? "border-green-600/30 bg-green-600/20 text-green-400" : "border-orange-600/30 bg-orange-600/20 text-orange-400"}`}
              variant="outline"
            >
              {(service as any).paymentStatus === "SUCCEEDED"
                ? "PAGO"
                : "PENDENTE"}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default BookingSummary
