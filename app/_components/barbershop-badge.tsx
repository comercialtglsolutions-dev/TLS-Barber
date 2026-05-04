"use client"

import { Store as StoreIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "../_providers/auth"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog"

interface BarbershopBadgeProps {
  name: string
  address: string
}

const BarbershopBadge = ({ name, address }: BarbershopBadgeProps) => {
  const router = useRouter()
  const { profile } = useAuth()

  const isAdmin = profile?.role === "ADMIN"

  const handleChangeUnit = () => {
    router.push("/dashboard")
  }

  return (
    <div className="mt-4 lg:mt-0">
      <div className="flex flex-col items-start lg:items-end">
        {isAdmin ? (
          <div className="flex items-center gap-2 rounded-full border border-[#3EABFD]/30 bg-[#3EABFD]/10 px-4 py-1.5 backdrop-blur-md">
            <StoreIcon className="h-4 w-4 text-[#3EABFD]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white lg:text-base">
              {name}
            </h2>
          </div>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="group flex items-center gap-2 rounded-full border border-[#3EABFD]/30 bg-[#3EABFD]/10 px-4 py-1.5 backdrop-blur-md transition-all hover:bg-[#3EABFD]/20 active:scale-95">
                <StoreIcon className="h-4 w-4 text-[#3EABFD]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white group-hover:text-[#3EABFD] lg:text-base">
                  {name}
                </h2>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[90%] rounded-2xl border-white/10 bg-[#1D1D1D]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl text-white">
                  Mudar de unidade?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
                  Você será redirecionado para a tela de seleção para escolher
                  outra barbearia.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row gap-3 pt-4">
                <AlertDialogCancel className="flex-1 rounded-xl border border-white/10 bg-transparent text-white hover:bg-white/5">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleChangeUnit}
                  className="flex-1 rounded-xl border-none bg-[#3EABFD] text-white hover:bg-[#2e8acb]"
                >
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <p className="mt-2 flex items-center gap-1 text-[10px] text-gray-400 lg:text-xs">
          <span className="h-1 w-1 rounded-full bg-[#3EABFD]" />
          {address}
        </p>
      </div>
    </div>
  )
}

export default BarbershopBadge
