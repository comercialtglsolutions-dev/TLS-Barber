"use client"

import Image from "next/image"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { CalendarIcon, MenuIcon } from "lucide-react"
import { Sheet, SheetTrigger } from "./ui/sheet"
import SidebarSheet from "./sidebar-sheet"
import Notifications from "./notifications"
import Link from "next/link"
import { useAuth } from "../_providers/auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const Header = () => {
  const { user, profile } = useAuth()
  const router = useRouter()

  const handleBookingsClick = () => {
    if (!user) {
      return toast.error(
        "Você precisa estar logado para ver seus agendamentos.",
      )
    }
    router.push("/bookings")
  }

  const role = profile?.role
  const subscriptionPlan = profile?.subscriptionPlan
  const trialEndsAt = profile?.trialEndsAt

  return (
    <Card>
      <CardContent className="flex flex-row items-center justify-between bg-[#1D1D1D] p-5">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link
            href={
              user ? (role === "ADMIN" ? "/dashboard" : "/barbershops") : "/"
            }
          >
            <Image
              alt="TLS Barber"
              src="/Logo.svg"
              height={18}
              width={180}
              style={{ height: "auto" }}
              className="lg:ml-[250px]"
            />
          </Link>

          {/* TRIAL BADGE - ONLY FOR ADMIN AND FREE PLAN */}
          {user && role === "ADMIN" && subscriptionPlan === "FREE" && (
            <div className="hidden items-center gap-2 rounded-full border border-[#2C78B2]/20 bg-[#2C78B2]/10 px-3 py-1.5 md:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2C78B2]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2C78B2]">
                Teste:{" "}
                {(() => {
                  const endsAt = trialEndsAt
                  if (!endsAt) return 0
                  const now = new Date()
                  const end = new Date(endsAt)
                  const diffInMs = end.getTime() - now.getTime()
                  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24))
                  return diffInDays > 0 ? diffInDays : 0
                })()}{" "}
                dias
              </span>
            </div>
          )}
        </div>

        {/* Botões e Menu */}
        <div className="flex items-center lg:mr-[250px]">
          <Notifications />

          {/* Desktop specific */}
          <div className="hidden items-center lg:flex">
            <Button
              variant="default"
              className="mr-2 flex justify-start gap-2 rounded-xl border border-white/10 bg-transparent hover:bg-white/10"
              onClick={handleBookingsClick}
            >
              <CalendarIcon className="h-4 w-4 text-white" />
              <span className="text-white">Agendamentos</span>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  className="mr-2 flex justify-center gap-2 rounded-xl border border-white/10 bg-transparent hover:bg-white/10"
                >
                  <MenuIcon color="#ffffff" />
                </Button>
              </SheetTrigger>
              <SidebarSheet />
            </Sheet>
          </div>

          {/* Mobile specific */}
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="mr-2 flex justify-center gap-2 rounded-xl border border-white/10 bg-transparent hover:bg-white/10"
                >
                  <MenuIcon color="#ffffff" />
                </Button>
              </SheetTrigger>
              <SidebarSheet />
            </Sheet>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default Header
