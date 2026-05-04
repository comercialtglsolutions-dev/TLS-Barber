"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/app/_components/ui/button"
import ServicesTable from "./services-table"
import ProductsTable from "./products-table"
import CombosTable from "./combos-table"
import SettingsForm from "./settings-form"
import { Service, Product, Settings } from "@prisma/client"
import {
  LayoutDashboardIcon,
  PackageIcon,
  ScissorsIcon,
  StarsIcon,
  SettingsIcon,
  ClockIcon,
  CreditCardIcon,
  UsersIcon,
} from "lucide-react"
import OperatingHoursManager from "./operating-hours-manager"
import IntegrationsManager from "./integrations-manager"
import BarbersTable from "./barbers-table"

interface ManagementTabsProps {
  services: Service[]
  products: Product[]
  combos: (any & { service1: Service; service2: Service })[]
  settings: Settings
  operatingDays: any[]
  operatingExceptions: any[]
  banks: any[]
  barbers: any[]
  subscriptionPlan: string
  children: React.ReactNode // Dashboard content
}

const ManagementTabs = ({
  services,
  products,
  combos,
  subscriptionPlan,
  settings,
  operatingDays,
  operatingExceptions,
  banks,
  barbers,
  children,
}: ManagementTabsProps) => {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") as any

  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "services"
    | "products"
    | "combos"
    | "settings"
    | "operating-hours"
    | "bancos"
    | "barbers"
  >(initialTab || "dashboard")

  // Update tab if URL changes (optional but good for UX)
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (
      tab &&
      (tab === "bancos" ||
        tab === "barbers" ||
        tab === "services" ||
        tab === "products" ||
        tab === "combos" ||
        tab === "settings" ||
        tab === "operating-hours" ||
        tab === "dashboard")
    ) {
      setActiveTab(tab as any)
    }
  }, [searchParams])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex w-full items-center gap-2 overflow-x-auto whitespace-nowrap border-b border-white/10 pb-4 lg:gap-4 [&::-webkit-scrollbar]:hidden">
        <Button
          variant={activeTab === "dashboard" ? "default" : "ghost"}
          onClick={() => setActiveTab("dashboard")}
          className="h-9 px-3 text-xs lg:h-10 lg:gap-2 lg:px-4 lg:text-sm"
        >
          <LayoutDashboardIcon className="mr-2 h-4 w-4 lg:mr-0" />
          Dashboard
        </Button>
        <Button
          variant={activeTab === "services" ? "default" : "ghost"}
          onClick={() => setActiveTab("services")}
          className="h-9 px-3 text-xs lg:h-10 lg:gap-2 lg:px-4 lg:text-sm"
        >
          <ScissorsIcon className="mr-2 h-4 w-4 lg:mr-0" />
          Serviços
        </Button>
        <Button
          variant={activeTab === "products" ? "default" : "ghost"}
          onClick={() => setActiveTab("products")}
          className="h-9 px-3 text-xs lg:h-10 lg:gap-2 lg:px-4 lg:text-sm"
        >
          <PackageIcon className="mr-2 h-4 w-4 lg:mr-0" />
          Produtos
        </Button>
        <Button
          variant={activeTab === "combos" ? "default" : "ghost"}
          onClick={() => setActiveTab("combos")}
          className="h-9 px-3 text-xs lg:h-10 lg:gap-2 lg:px-4 lg:text-sm"
        >
          <StarsIcon className="mr-2 h-4 w-4 lg:mr-0" />
          Combos
        </Button>
        <Button
          variant={activeTab === "barbers" ? "default" : "ghost"}
          onClick={() => setActiveTab("barbers")}
          className="h-9 px-3 text-xs lg:h-10 lg:gap-2 lg:px-4 lg:text-sm"
        >
          <UsersIcon className="mr-2 h-4 w-4 lg:mr-0" />
          Barbeiros
        </Button>
        <Button
          variant={activeTab === "operating-hours" ? "default" : "ghost"}
          onClick={() => setActiveTab("operating-hours")}
          className="h-9 px-3 text-xs lg:h-10 lg:gap-2 lg:px-4 lg:text-sm"
        >
          <ClockIcon className="mr-2 h-4 w-4 lg:mr-0" />
          Horários
        </Button>
        <Button
          variant={activeTab === "bancos" ? "default" : "ghost"}
          onClick={() => setActiveTab("bancos")}
          className="h-9 px-3 text-xs lg:h-10 lg:gap-2 lg:px-4 lg:text-sm"
        >
          <CreditCardIcon className="mr-2 h-4 w-4 lg:mr-0" />
          Bancos
        </Button>
        <Button
          variant={activeTab === "settings" ? "default" : "ghost"}
          onClick={() => setActiveTab("settings")}
          className="h-9 px-3 text-xs lg:h-10 lg:gap-2 lg:px-4 lg:text-sm"
        >
          <SettingsIcon className="mr-2 h-4 w-4 lg:mr-0" />
          Configurações
        </Button>
      </div>

      <div className="mt-2">
        {activeTab === "dashboard" && children}
        {activeTab === "services" && (
          <ServicesTable
            services={services}
            subscriptionPlan={subscriptionPlan}
          />
        )}
        {activeTab === "products" && (
          <ProductsTable
            products={products}
            subscriptionPlan={subscriptionPlan}
          />
        )}
        {activeTab === "combos" && (
          <CombosTable
            combos={combos}
            services={services}
            subscriptionPlan={subscriptionPlan}
          />
        )}
        {activeTab === "settings" && <SettingsForm settings={settings} />}
        {activeTab === "operating-hours" && (
          <OperatingHoursManager
            operatingDays={operatingDays}
            operatingExceptions={operatingExceptions}
          />
        )}
        {activeTab === "bancos" && (
          <IntegrationsManager banks={banks} settings={settings} />
        )}
        {activeTab === "barbers" && <BarbersTable barbers={barbers} />}
      </div>
    </div>
  )
}

export default ManagementTabs
