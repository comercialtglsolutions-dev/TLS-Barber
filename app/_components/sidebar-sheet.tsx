"use client"

import { Button } from "./ui/button"
import {
  CalendarIcon,
  HomeIcon,
  LogOutIcon,
  Store as StoreIcon,
} from "lucide-react"
import { SheetClose, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet"
import { quickSearchOptions } from "../_constants/search"
import { Settings as SettingsIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "../_providers/auth"
import UserIcon from "./user-icon"
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

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { getSettings } from "../_actions/get-settings"
import { InstagramIcon, CreditCard } from "lucide-react"

const SidebarSheet = () => {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getSettings()
      setSettings(settings)
    }
    fetchSettings()
  }, [])

  const handleLogoutClick = () => signOut()

  const handleBookingsClick = () => {
    if (!user) {
      return toast.error(
        "Você precisa estar logado para ver seus agendamentos.",
      )
    }
    router.push("/bookings")
  }

  return (
    <SheetContent className="overflow-y-auto bg-[#1D1D1D] p-6 lg:p-8">
      <div className="flex h-full flex-col">
        <div className="flex-1">
          <SheetHeader>
            <SheetTitle className="text-left text-white">Menu</SheetTitle>
          </SheetHeader>

          <UserIcon />

          <div className="flex flex-col gap-2 border-b border-solid py-5">
            <SheetClose asChild>
              <Button className="justify-start gap-2" asChild>
                <Link href="/" className="text-white">
                  <HomeIcon size={18} color="#FFFFFF" />
                  Início
                </Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button
                className="justify-start gap-2"
                onClick={handleBookingsClick}
              >
                <CalendarIcon size={18} color="#FFFFFF" />
                <span className="text-white">Agendamentos</span>
              </Button>
            </SheetClose>

            {profile?.role === "ADMIN" && (
              <>
                <Button className="justify-start gap-2" asChild>
                  <Link href="/admin" className="text-white">
                    <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-primary text-[10px] text-white">
                      A
                    </div>
                    Painel administrativo
                  </Link>
                </Button>

                <SheetClose asChild>
                  <Button
                    className="justify-start gap-2 text-white"
                    onClick={() => router.push("/admin/subscription")}
                  >
                    <CreditCard size={18} color="#FFFFFF" />
                    Gerenciar Assinatura
                  </Button>
                </SheetClose>
              </>
            )}

            {user && profile?.role !== "ADMIN" && (
              <SheetClose asChild>
                <Button className="justify-start gap-2" asChild>
                  <Link href="/dashboard" className="text-white">
                    <StoreIcon size={18} color="#FFFFFF" />
                    Escolher outra barbearia
                  </Link>
                </Button>
              </SheetClose>
            )}
          </div>

          <div className="flex flex-col gap-2 border-b border-solid py-5">
            {quickSearchOptions.map((option) => (
              <SheetClose key={option.title} asChild>
                <Button className="justify-start gap-2" asChild>
                  <Link href={`/barbershops?service=${option.title}`}>
                    <Image
                      alt={option.title}
                      src={option.imageUrl}
                      height={18}
                      width={18}
                    />
                    <span className="text-white">{option.title}</span>
                  </Link>
                </Button>
              </SheetClose>
            ))}
          </div>

          {user && profile?.role !== "ADMIN" && (
            <div className="flex flex-col gap-2 border-b border-solid py-5">
              <SheetClose asChild>
                <Button className="justify-start gap-2" asChild>
                  <Link href="/settings" className="text-white">
                    <SettingsIcon size={18} color="#FFFFFF" />
                    Configurações
                  </Link>
                </Button>
              </SheetClose>
            </div>
          )}

          {user && (
            <div className="flex flex-col gap-2 py-5">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="justify-start gap-2 text-white">
                    <LogOutIcon size={18} color="#FFFFFF" />
                    Sair da conta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[90%] rounded-2xl border-white/10 bg-[#1D1D1D]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">
                      Sair da conta
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      Tem certeza que deseja sair da sua conta? Você precisará
                      fazer login novamente para acessar o sistema.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-row gap-3 pt-4">
                    <AlertDialogCancel className="flex-1 rounded-xl border-white/10 bg-transparent text-white hover:bg-white/5">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLogoutClick}
                      className="flex-1 rounded-xl border-none bg-red-500 text-white hover:bg-red-600"
                    >
                      Sair
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          <div className="flex flex-col items-center gap-4 border-t border-solid py-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Siga-nos nas redes sociais
            </span>
            <div className="flex gap-6">
              {settings?.phones[0] && (
                <Link
                  href={`https://wa.me/55${settings.phones[0].replace(/\D/g, "")}`}
                  target="_blank"
                  className="text-white transition-colors hover:text-[#25D366]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </Link>
              )}
              <Link
                href="https://www.instagram.com/barbearia_gb_cortes/"
                target="_blank"
                className="text-white transition-colors hover:text-[#E4405F]"
              >
                <InstagramIcon size={24} />
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 pb-[60px] lg:pb-4">
          <p className="text-xs text-gray-400">
            © 2025 Copyright <span className="font-bold">TLS Barber.</span>
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">Desenvolvido por</span>
            <Link
              href="https://www.tglsolutions.com.br"
              target="_blank"
              className="ml-1"
            >
              <Image
                alt="TGL Solutions"
                src="/logo-tgl.svg"
                height={18}
                width={100}
                style={{ height: "auto" }}
              />
            </Link>
          </div>
        </div>
      </div>
    </SheetContent>
  )
}

export default SidebarSheet
