"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import {
  Check,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"
import { getOnboardingStatus, finishOnboarding } from "../_actions/onboarding"
import { upsertSettings } from "../_actions/upsert-settings"
import { upsertOperatingDay } from "../_actions/upsert-operating-day"
import { upsertService } from "../_actions/upsert-service"
import { upsertProduct } from "../_actions/upsert-product"
import { upsertCombo } from "../_actions/upsert-combo"
import { uploadImage } from "../_actions/upload-image"
import { Camera, Image as ImageIcon } from "lucide-react"
import ImageUpload from "../admin/_components/image-upload"
import { getPlanLimits } from "../_lib/subscription-limits"
import { deleteService } from "../_actions/delete-service"
import { deleteProduct } from "../_actions/delete-product"
import { deleteCombo } from "../_actions/delete-combo"
import { upsertBarber } from "../_actions/upsert-barber"
import { deleteBarber } from "../_actions/delete-barber"

const STEPS = [
  { id: 1, title: "Identidade", description: "Sua marca no sistema" },
  { id: 2, title: "Agenda", description: "Quando você atende" },
  { id: 3, title: "Equipe", description: "Quem atende com você" },
  { id: 4, title: "Serviços", description: "O que você oferece" },
  { id: 5, title: "Produtos", description: "O que você vende" },
  { id: 6, title: "Combos", description: "Suas melhores ofertas" },
  { id: 7, title: "Pagamentos", description: "Como você quer receber" },
]

const DAYS_OF_WEEK = [
  { id: 1, name: "Segunda-feira" },
  { id: 2, name: "Terça-feira" },
  { id: 3, name: "Quarta-feira" },
  { id: 4, name: "Quinta-feira" },
  { id: 5, name: "Sexta-feira" },
  { id: 6, name: "Sábado" },
  { id: 0, name: "Domingo" },
]

export default function OnboardingWizard({
  initialStatus,
}: {
  initialStatus?: any
}) {
  const [isOpen, setIsOpen] = useState(() => {
    if (initialStatus && initialStatus.isCompleted === false) return true
    return false
  })
  const [currentStep, setCurrentStep] = useState(
    initialStatus?.currentStep || 1,
  )
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<any>(initialStatus || null)
  const router = useRouter()
  const pathname = usePathname()

  // Form States
  const [settings, setSettings] = useState(() => {
    let base = {
      name: "",
      address: "",
      description: "",
      imageUrl:
        "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop",
      phones: [""],
      instagramUrl: "",
      whatsappUrl: "",
    }
    if (initialStatus?.existingData?.settings) {
      base = { ...base, ...initialStatus.existingData.settings }
    }
    return base
  })

  const [operatingDays, setOperatingDays] = useState(() => {
    if (initialStatus?.existingData?.operatingDays?.length > 0)
      return initialStatus.existingData.operatingDays
    return DAYS_OF_WEEK.map((day) => ({
      dayOfWeek: day.id,
      startTime: "09:00",
      endTime: "19:00",
      isOpen: day.id !== 0,
    }))
  })

  const [services, setServices] = useState<any[]>(
    initialStatus?.existingData?.services || [],
  )
  const [products, setProducts] = useState<any[]>(
    initialStatus?.existingData?.products || [],
  )
  const [combos, setCombos] = useState<any[]>(
    initialStatus?.existingData?.combos || [],
  )
  const [barbers, setBarbers] = useState<any[]>(
    initialStatus?.existingData?.barbers || [],
  )
  const [pixConfig, setPixConfig] = useState(() => {
    if (initialStatus?.existingData?.settings?.pixKey) {
      return {
        pixKey: initialStatus.existingData.settings.pixKey,
        pixKeyType: initialStatus.existingData.settings.pixKeyType || "CPF",
        pixBeneficiary:
          initialStatus.existingData.settings.pixBeneficiary || "",
      }
    }
    return {
      pixKey: "",
      pixKeyType: "CPF",
      pixBeneficiary: "",
    }
  })

  // Local Input States for adding items
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
  })
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
  })
  const [newCombo, setNewCombo] = useState({
    name: "",
    description: "",
    price: "",
    service1Id: "",
    service2Id: "",
    imageUrl: "",
  })
  const [newBarber, setNewBarber] = useState({
    name: "",
    description: "",
    imageUrl: "",
  })

  useEffect(() => {
    const isInternalRoute =
      pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")
    if (isInternalRoute) {
      checkStatus()
    }
  }, [pathname])

  const checkStatus = async () => {
    const res = await getOnboardingStatus()
    if (!res.isCompleted) {
      setIsOpen(true)
      setStatus(res)

      if (res.currentStep) {
        setCurrentStep(res.currentStep)
      }
      if (res.existingData) {
        if (res.existingData.services?.length > 0)
          setServices(res.existingData.services)
        if (res.existingData.products?.length > 0)
          setProducts(res.existingData.products)
        if (res.existingData.combos?.length > 0)
          setCombos(res.existingData.combos)
        if (res.existingData.barbers?.length > 0)
          setBarbers(res.existingData.barbers)
        if (res.existingData.settings) {
          setSettings((prev) => ({ ...prev, ...res.existingData.settings }))
          if (res.existingData.settings.pixKey) {
            setPixConfig({
              pixKey: res.existingData.settings.pixKey,
              pixKeyType: res.existingData.settings.pixKeyType || "CPF",
              pixBeneficiary: res.existingData.settings.pixBeneficiary || "",
            })
          }
        }
        if (res.existingData.operatingDays?.length > 0)
          setOperatingDays(res.existingData.operatingDays)
      }
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    setLoading(true)
    try {
      const url = await uploadImage(formData)
      setSettings((prev) => ({ ...prev, imageUrl: url }))
      toast.success("Imagem carregada com sucesso!")
    } catch (error) {
      toast.error("Erro ao carregar imagem")
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    setLoading(true)
    try {
      if (currentStep === 1) {
        if (!settings.name || !settings.address)
          throw new Error("Preencha os campos obrigatórios")
        const payload = {
          ...settings,
          startHour: "09:00",
          endHour: "19:00",
        } as any
        if (payload.id) delete payload.id
        await upsertSettings(payload)
      } else if (currentStep === 2) {
        await Promise.all(
          operatingDays.map((day: any) => upsertOperatingDay(day)),
        )
      } else if (currentStep === 3) {
        if (barbers.length === 0)
          throw new Error("Cadastre pelo menos um profissional")
      } else if (currentStep === 4) {
        if (services.length === 0)
          throw new Error("Cadastre pelo menos um serviço")
      } else if (currentStep === 5) {
        if (products.length === 0)
          throw new Error("Cadastre pelo menos um produto")
      } else if (currentStep === 6) {
        if (combos.length === 0) throw new Error("Cadastre pelo menos um combo")
      } else if (currentStep === 7) {
        if (!pixConfig.pixKey || !pixConfig.pixBeneficiary)
          throw new Error("Preencha a chave Pix e a instituição bancária")
        // Salva a chave Pix junto com o settings existente
        await upsertSettings({
          ...settings,
          startHour: "09:00",
          endHour: "19:00",
          pixKey: pixConfig.pixKey,
          pixKeyType: pixConfig.pixKeyType,
          pixBeneficiary: pixConfig.pixBeneficiary,
        } as any)
        await finishOnboarding()
        setIsOpen(false)
        toast.success("Onboarding concluído! Bem-vindo ao seu painel.")
        router.refresh()
        return
      }
      setCurrentStep((prev: number) => prev + 1)
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar")
    } finally {
      setLoading(false)
    }
  }

  const addService = async () => {
    if (!newService.name || !newService.price)
      return toast.error("Nome e preço são obrigatórios")
    setLoading(true)
    try {
      const saved = await upsertService({
        ...newService,
        price: Number(newService.price),
      })
      setServices((prev) => {
        const exists = prev.find((s) => s.id === saved.id)
        if (exists) return prev.map((s) => (s.id === saved.id ? saved : s))
        return [...prev, saved]
      })
      setNewService({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
      })
      toast.success("Serviço adicionado!")
    } catch (e: any) {
      toast.error(e.message || "Erro ao adicionar serviço")
    } finally {
      setLoading(false)
    }
  }

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price)
      return toast.error("Nome e preço são obrigatórios")
    setLoading(true)
    try {
      const saved = await upsertProduct({
        ...newProduct,
        price: Number(newProduct.price),
      })
      setProducts((prev) => {
        const exists = prev.find((p) => p.id === saved.id)
        if (exists) return prev.map((p) => (p.id === saved.id ? saved : p))
        return [...prev, saved]
      })
      setNewProduct({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
      })
      toast.success("Produto adicionado!")
    } catch (e: any) {
      toast.error(e.message || "Erro ao adicionar produto")
    } finally {
      setLoading(false)
    }
  }

  const addCombo = async () => {
    if (!newCombo.name || !newCombo.service1Id || !newCombo.service2Id)
      return toast.error("Nome e serviços são obrigatórios")
    setLoading(true)
    try {
      const saved = await upsertCombo({
        ...newCombo,
        price: newCombo.price ? Number(newCombo.price) : undefined,
      })
      setCombos((prev) => {
        const exists = prev.find((c) => c.id === saved.id)
        if (exists) return prev.map((c) => (c.id === saved.id ? saved : c))
        return [...prev, saved]
      })
      setNewCombo({
        name: "",
        description: "",
        price: "",
        service1Id: "",
        service2Id: "",
        imageUrl: "",
      })
      toast.success("Combo adicionado!")
    } catch (e: any) {
      toast.error(e.message || "Erro ao adicionar combo")
    } finally {
      setLoading(false)
    }
  }

  const removeService = async (id: string) => {
    try {
      await deleteService(id)
      setServices(services.filter((s) => s.id !== id))
      toast.success("Serviço removido!")
    } catch (e: any) {
      toast.error(e.message || "Erro ao remover serviço")
    }
  }

  const removeProduct = async (id: string) => {
    try {
      await deleteProduct(id)
      setProducts(products.filter((p) => p.id !== id))
      toast.success("Produto removido!")
    } catch (e: any) {
      toast.error(e.message || "Erro ao remover produto")
    }
  }

  const removeCombo = async (id: string) => {
    try {
      await deleteCombo(id)
      setCombos(combos.filter((c) => c.id !== id))
      toast.success("Combo removido!")
    } catch (e: any) {
      toast.error(e.message || "Erro ao remover combo")
    }
  }

  const addBarber = async () => {
    if (!newBarber.name) return toast.error("O nome do barbeiro é obrigatório")
    setLoading(true)
    try {
      const saved = await upsertBarber(newBarber)
      setBarbers((prev) => {
        const exists = prev.find((b) => b.id === saved.id)
        if (exists) return prev.map((b) => (b.id === saved.id ? saved : b))
        return [...prev, saved]
      })
      setNewBarber({ name: "", description: "", imageUrl: "" })
      toast.success("Barbeiro adicionado!")
    } catch (e: any) {
      toast.error(e.message || "Erro ao adicionar barbeiro")
    } finally {
      setLoading(false)
    }
  }

  const removeBarber = async (id: string) => {
    try {
      await deleteBarber(id)
      setBarbers(barbers.filter((b) => b.id !== id))
      toast.success("Barbeiro removido!")
    } catch (e: any) {
      toast.error(e.message || "Erro ao remover barbeiro")
    }
  }

  const limits = getPlanLimits((status?.plan as any) || "FREE")

  if (status?.isCompleted === true) return null

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-4xl border-white/5 bg-[#111111] p-0 shadow-2xl [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex h-[850px] flex-col overflow-hidden rounded-lg md:flex-row">
          {/* Sidebar */}
          <div className="w-full border-r border-white/5 bg-[#0A0A0A] p-6 md:w-64">
            <div className="mb-8">
              <h2 className="text-lg font-bold text-white">Configuração</h2>
              <p className="text-xs text-gray-500">Etapa {currentStep} de 7</p>
            </div>
            <div className="space-y-4">
              {STEPS.map((step) => (
                <div key={step.id} className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${currentStep >= step.id ? "bg-[#2C78B2] text-white" : "bg-white/5 text-gray-500"}`}
                  >
                    {currentStep > step.id ? <Check size={14} /> : step.id}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${currentStep >= step.id ? "text-white" : "text-gray-500"}`}
                    >
                      {step.title}
                    </p>
                    <p className="text-[10px] text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="relative flex flex-1 flex-col p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold text-white">
                {STEPS[currentStep - 1].title}
              </DialogTitle>
              <p className="text-sm text-gray-400">
                {currentStep === 1 && "Conte-nos mais sobre sua barbearia."}
                {currentStep === 2 &&
                  "Configure os horários que seus clientes poderão agendar."}
                {currentStep === 3 &&
                  "Quem são os profissionais da sua barbearia?"}
                {currentStep === 4 && "Quais serviços seus barbeiros executam?"}
                {currentStep === 5 && "Quais produtos você tem à venda?"}
                {currentStep === 6 && "Crie pacotes especiais com desconto."}
                {currentStep === 7 &&
                  "Informe onde seus clientes devem pagar. Sem criar conta nova."}
              </p>
            </DialogHeader>

            <div className="custom-scrollbar flex-1 overflow-y-auto px-4">
              {currentStep === 1 && (
                <div className="space-y-6 pt-2">
                  {/* Upload de Imagem */}
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="group relative">
                      <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-[#2C78B2]/20 bg-white/5 transition-all group-hover:border-[#2C78B2]/50">
                        {settings.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={settings.imageUrl}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-500">
                            <ImageIcon size={40} />
                          </div>
                        )}
                      </div>
                      <label
                        htmlFor="image-upload"
                        className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#2C78B2] text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                      >
                        <Camera size={18} />
                        <input
                          id="image-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">
                        Logo da Barbearia
                      </p>
                      <p className="text-[10px] text-gray-500">
                        PNG, JPG ou WEBP até 5MB
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-gray-500">
                      Nome da Barbearia *
                    </Label>
                    <Input
                      value={settings.name}
                      onChange={(e) =>
                        setSettings({ ...settings, name: e.target.value })
                      }
                      placeholder="Ex: Barber Shop Elite"
                      className="border-white/5 bg-white/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-gray-500">
                      Endereço *
                    </Label>
                    <Input
                      value={settings.address}
                      onChange={(e) =>
                        setSettings({ ...settings, address: e.target.value })
                      }
                      placeholder="Rua, Número, Bairro - Cidade"
                      className="border-white/5 bg-white/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-gray-500">
                      Telefone (Opcional)
                    </Label>
                    <Input
                      value={settings.phones[0]}
                      onChange={(e) =>
                        setSettings({ ...settings, phones: [e.target.value] })
                      }
                      placeholder="(00) 00000-0000"
                      className="border-white/5 bg-white/5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-gray-500">
                        WhatsApp (Opcional)
                      </Label>
                      <Input
                        value={settings.whatsappUrl}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            whatsappUrl: e.target.value,
                          })
                        }
                        placeholder="https://wa.me/..."
                        className="border-white/5 bg-white/5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-gray-500">
                        Instagram (Opcional)
                      </Label>
                      <Input
                        value={settings.instagramUrl}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            instagramUrl: e.target.value,
                          })
                        }
                        placeholder="@suabearbearia"
                        className="border-white/5 bg-white/5"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-gray-500">
                      Descrição
                    </Label>
                    <Textarea
                      value={settings.description}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          description: e.target.value,
                        })
                      }
                      placeholder="Conte um pouco sobre sua barbearia..."
                      className="border-white/5 bg-white/5"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-3">
                  {DAYS_OF_WEEK.map((day) => {
                    const dayData = operatingDays.find(
                      (d: any) => d.dayOfWeek === day.id,
                    )
                    return (
                      <div
                        key={day.id}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3"
                      >
                        <span className="text-sm font-medium text-white">
                          {day.name}
                        </span>
                        <div className="flex items-center gap-2">
                          {dayData?.isOpen ? (
                            <>
                              <Input
                                type="time"
                                value={dayData.startTime}
                                onChange={(e) =>
                                  setOperatingDays(
                                    operatingDays.map((d: any) =>
                                      d.dayOfWeek === day.id
                                        ? { ...d, startTime: e.target.value }
                                        : d,
                                    ),
                                  )
                                }
                                className="w-24 border-white/5 bg-black/40 text-xs"
                              />
                              <span className="text-gray-500">-</span>
                              <Input
                                type="time"
                                value={dayData.endTime}
                                onChange={(e) =>
                                  setOperatingDays(
                                    operatingDays.map((d: any) =>
                                      d.dayOfWeek === day.id
                                        ? { ...d, endTime: e.target.value }
                                        : d,
                                    ),
                                  )
                                }
                                className="w-24 border-white/5 bg-black/40 text-xs"
                              />
                            </>
                          ) : (
                            <span className="text-xs text-red-500">
                              Fechado
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setOperatingDays(
                                operatingDays.map((d: any) =>
                                  d.dayOfWeek === day.id
                                    ? { ...d, isOpen: !d.isOpen }
                                    : d,
                                ),
                              )
                            }
                            className={`text-[10px] ${dayData?.isOpen ? "text-gray-500" : "text-[#2C78B2]"}`}
                          >
                            {dayData?.isOpen ? "Fechar" : "Abrir"}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-[#2C78B2]/20 bg-[#2C78B2]/5 p-6">
                    <div className="flex flex-col items-center gap-6">
                      <div
                        className="group relative cursor-pointer"
                        onClick={() => {}}
                      >
                        <ImageUpload
                          value={newBarber.imageUrl}
                          onChange={(url) =>
                            setNewBarber({ ...newBarber, imageUrl: url })
                          }
                        />
                        <p className="mt-2 text-center text-[10px] text-gray-500">
                          Foto do Profissional
                        </p>
                      </div>

                      <div className="w-full space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-widest text-gray-500">
                            Nome do Barbeiro *
                          </Label>
                          <Input
                            value={newBarber.name}
                            onChange={(e) =>
                              setNewBarber({
                                ...newBarber,
                                name: e.target.value,
                              })
                            }
                            placeholder="Ex: João da Silva"
                            className="border-white/5 bg-white/5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-widest text-gray-500">
                            Especialidade / Descrição
                          </Label>
                          <Input
                            value={newBarber.description}
                            onChange={(e) =>
                              setNewBarber({
                                ...newBarber,
                                description: e.target.value,
                              })
                            }
                            placeholder="Ex: Especialista em degradê e barba"
                            className="border-white/5 bg-white/5"
                          />
                        </div>
                        <Button
                          onClick={addBarber}
                          className="w-full bg-[#2C78B2] hover:bg-[#1E5A8A]"
                          disabled={loading}
                        >
                          <Plus size={16} className="mr-2" /> Adicionar à Equipe
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Profissionais ({barbers.length})
                    </p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {barbers
                        .filter((b) => b && b.name)
                        .map((barber, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10">
                                {barber.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={barber.imageUrl}
                                    alt={barber.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-[#222] text-gray-600">
                                    <UserIcon className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">
                                  {barber.name}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {barber.description || "Profissional"}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                              onClick={() => removeBarber(barber.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  {services.length < limits.maxServices && (
                    <div className="rounded-xl border border-[#2C78B2]/20 bg-[#2C78B2]/5 p-4">
                      <div className="mb-4 space-y-2 lg:space-y-4">
                        <div className="space-y-1">
                          <Label className="text-[11px] lg:text-sm">Nome</Label>
                          <Input
                            value={newService.name}
                            onChange={(e) =>
                              setNewService({
                                ...newService,
                                name: e.target.value,
                              })
                            }
                            placeholder="Ex: Corte de Cabelo"
                            className="h-8 border-white/10 bg-[#222] text-sm lg:h-10"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] lg:text-sm">
                            Descrição
                          </Label>
                          <Input
                            value={newService.description}
                            onChange={(e) =>
                              setNewService({
                                ...newService,
                                description: e.target.value,
                              })
                            }
                            placeholder="Ex: Corte social completo..."
                            className="h-8 border-white/10 bg-[#222] text-sm lg:h-10"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] lg:text-sm">
                            Preço (R$)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newService.price}
                            onChange={(e) =>
                              setNewService({
                                ...newService,
                                price: e.target.value,
                              })
                            }
                            placeholder="Ex: 50.00"
                            className="h-8 border-white/10 bg-[#222] text-sm lg:h-10"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] lg:text-sm">
                            Imagem
                          </Label>
                          <ImageUpload
                            value={newService.imageUrl}
                            onChange={(url) =>
                              setNewService({ ...newService, imageUrl: url })
                            }
                          />
                        </div>
                      </div>
                      <Button
                        onClick={addService}
                        className="w-full bg-[#2C78B2] hover:bg-[#1E5A8A]"
                        disabled={loading}
                      >
                        <Plus size={16} className="mr-2" /> Adicionar Serviço
                      </Button>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1 text-xs text-gray-500">
                      <span>Cadastrados: {services.length}</span>
                      <span>
                        {limits.maxServices === Infinity
                          ? "Ilimitado"
                          : `Restantes: ${Math.max(0, limits.maxServices - services.length)}`}
                      </span>
                    </div>
                    {services.length > 0 && (
                      <>
                        <div className="flex flex-col gap-3 lg:hidden">
                          {services.map((s, i) => (
                            <div
                              key={i}
                              className="flex flex-col gap-3 rounded-lg border border-white/5 bg-[#222] p-4"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex flex-1 flex-col gap-1">
                                  <h3 className="font-bold text-white">
                                    {s.name}
                                  </h3>
                                  <span className="text-sm font-semibold text-[#3EABFD]">
                                    R${" "}
                                    {Number(s.price).toLocaleString("pt-BR", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                                  onClick={() => removeService(s.id)}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                              <p className="text-sm text-gray-400">
                                {s.description}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="hidden overflow-x-auto rounded-lg border border-white/5 lg:block">
                          <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-[#222] text-xs uppercase text-gray-500">
                              <tr>
                                <th className="px-4 py-3">Nome</th>
                                <th className="px-4 py-3">Descrição</th>
                                <th className="px-4 py-3">Preço</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {services.map((s, i) => (
                                <tr key={i} className="hover:bg-white/5">
                                  <td className="px-4 py-3 font-medium text-white">
                                    {s.name}
                                  </td>
                                  <td className="max-w-[200px] truncate px-4 py-3">
                                    {s.description}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3">
                                    R${" "}
                                    {Number(s.price).toLocaleString("pt-BR", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </td>
                                  <td className="flex justify-end px-4 py-3">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                                      onClick={() => removeService(s.id)}
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  {products.length < limits.maxProducts && (
                    <div className="rounded-xl border border-[#2C78B2]/20 bg-[#2C78B2]/5 p-4">
                      <div className="mb-4 space-y-2 lg:space-y-4">
                        <div className="space-y-1">
                          <Label className="text-[11px] lg:text-sm">Nome</Label>
                          <Input
                            value={newProduct.name}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                name: e.target.value,
                              })
                            }
                            placeholder="Ex: Pomada Matte"
                            className="h-8 border-white/10 bg-[#222] text-sm lg:h-10"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] lg:text-sm">
                            Descrição
                          </Label>
                          <Input
                            value={newProduct.description}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                description: e.target.value,
                              })
                            }
                            placeholder="Ex: Pomada modeladora efeito seco..."
                            className="h-8 border-white/10 bg-[#222] text-sm lg:h-10"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] lg:text-sm">
                            Preço (R$)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newProduct.price}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                price: e.target.value,
                              })
                            }
                            placeholder="Ex: 35.00"
                            className="h-8 border-white/10 bg-[#222] text-sm lg:h-10"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] lg:text-sm">
                            Imagem
                          </Label>
                          <ImageUpload
                            value={newProduct.imageUrl}
                            onChange={(url) =>
                              setNewProduct({ ...newProduct, imageUrl: url })
                            }
                          />
                        </div>
                      </div>
                      <Button
                        onClick={addProduct}
                        className="w-full bg-[#2C78B2] hover:bg-[#1E5A8A]"
                        disabled={loading}
                      >
                        <Plus size={16} className="mr-2" /> Adicionar Produto
                      </Button>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1 text-xs text-gray-500">
                      <span>Cadastrados: {products.length}</span>
                      <span>
                        {limits.maxProducts === Infinity
                          ? "Ilimitado"
                          : `Restantes: ${Math.max(0, limits.maxProducts - products.length)}`}
                      </span>
                    </div>
                    {products.length > 0 && (
                      <>
                        <div className="flex flex-col gap-3 lg:hidden">
                          {products.map((p, i) => (
                            <div
                              key={i}
                              className="flex flex-col gap-3 rounded-lg border border-white/5 bg-[#222] p-4"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex flex-1 flex-col gap-1">
                                  <h3 className="font-bold text-white">
                                    {p.name}
                                  </h3>
                                  <span className="text-sm font-semibold text-[#3EABFD]">
                                    R${" "}
                                    {Number(p.price).toLocaleString("pt-BR", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                                  onClick={() => removeProduct(p.id)}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                              <p className="text-sm text-gray-400">
                                {p.description}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="hidden overflow-x-auto rounded-lg border border-white/5 lg:block">
                          <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-[#222] text-xs uppercase text-gray-500">
                              <tr>
                                <th className="px-4 py-3">Nome</th>
                                <th className="px-4 py-3">Descrição</th>
                                <th className="px-4 py-3">Preço</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {products.map((p, i) => (
                                <tr key={i} className="hover:bg-white/5">
                                  <td className="px-4 py-3 font-medium text-white">
                                    {p.name}
                                  </td>
                                  <td className="max-w-[200px] truncate px-4 py-3">
                                    {p.description}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3">
                                    R${" "}
                                    {Number(p.price).toLocaleString("pt-BR", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </td>
                                  <td className="flex justify-end px-4 py-3">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                                      onClick={() => removeProduct(p.id)}
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="space-y-6">
                  {combos.length < limits.maxCombos && (
                    <div className="rounded-xl border border-[#2C78B2]/20 bg-[#2C78B2]/5 p-4">
                      <div className="mb-4 space-y-2 lg:space-y-4">
                        <div className="space-y-1">
                          <Label className="text-[11px] lg:text-sm">
                            Nome do Combo
                          </Label>
                          <Input
                            value={newCombo.name}
                            onChange={(e) =>
                              setNewCombo({ ...newCombo, name: e.target.value })
                            }
                            placeholder="Ex: Barba + Cabelo"
                            className="h-8 border-white/10 bg-[#222] text-sm lg:h-10"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] lg:text-sm">
                            Descrição
                          </Label>
                          <Input
                            value={newCombo.description}
                            onChange={(e) =>
                              setNewCombo({
                                ...newCombo,
                                description: e.target.value,
                              })
                            }
                            placeholder="Ex: Pacote completo..."
                            className="h-8 border-white/10 bg-[#222] text-sm lg:h-10"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] lg:text-sm">
                            Preço Opcional (R$)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newCombo.price}
                            onChange={(e) =>
                              setNewCombo({
                                ...newCombo,
                                price: e.target.value,
                              })
                            }
                            placeholder="Ex: 75.00"
                            className="h-8 border-white/10 bg-[#222] text-sm lg:h-10"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] lg:text-sm">
                            Serviço 1
                          </Label>
                          <select
                            value={newCombo.service1Id}
                            onChange={(e) =>
                              setNewCombo({
                                ...newCombo,
                                service1Id: e.target.value,
                              })
                            }
                            className="h-8 w-full rounded-md border border-white/10 bg-[#222] px-3 text-sm text-white lg:h-10"
                          >
                            <option value="">Selecione...</option>
                            {services.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] lg:text-sm">
                            Serviço 2
                          </Label>
                          <select
                            value={newCombo.service2Id}
                            onChange={(e) =>
                              setNewCombo({
                                ...newCombo,
                                service2Id: e.target.value,
                              })
                            }
                            className="h-8 w-full rounded-md border border-white/10 bg-[#222] px-3 text-sm text-white lg:h-10"
                          >
                            <option value="">Selecione...</option>
                            {services.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] lg:text-sm">
                            Imagem
                          </Label>
                          <ImageUpload
                            value={newCombo.imageUrl}
                            onChange={(url) =>
                              setNewCombo({ ...newCombo, imageUrl: url })
                            }
                          />
                        </div>
                      </div>
                      <Button
                        onClick={addCombo}
                        className="w-full bg-[#2C78B2] hover:bg-[#1E5A8A]"
                        disabled={loading}
                      >
                        <Plus size={16} className="mr-2" /> Adicionar Combo
                      </Button>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1 text-xs text-gray-500">
                      <span>Cadastrados: {combos.length}</span>
                      <span>
                        {limits.maxCombos === Infinity
                          ? "Ilimitado"
                          : `Restantes: ${Math.max(0, limits.maxCombos - combos.length)}`}
                      </span>
                    </div>
                    {combos.length > 0 && (
                      <>
                        <div className="flex flex-col gap-3 lg:hidden">
                          {combos.map((c, i) => (
                            <div
                              key={i}
                              className="flex flex-col gap-3 rounded-lg border border-white/5 bg-[#222] p-4"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex flex-1 flex-col gap-1">
                                  <h3 className="font-bold text-white">
                                    {c.name}
                                  </h3>
                                  {c.price && (
                                    <span className="text-sm font-semibold text-[#3EABFD]">
                                      R${" "}
                                      {Number(c.price).toLocaleString("pt-BR", {
                                        minimumFractionDigits: 2,
                                      })}
                                    </span>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                                  onClick={() => removeCombo(c.id)}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                              <p className="text-sm text-gray-400">
                                {c.description}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="hidden overflow-x-auto rounded-lg border border-white/5 lg:block">
                          <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-[#222] text-xs uppercase text-gray-500">
                              <tr>
                                <th className="px-4 py-3">Nome</th>
                                <th className="px-4 py-3">Descrição</th>
                                <th className="px-4 py-3">Preço</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {combos.map((c, i) => (
                                <tr key={i} className="hover:bg-white/5">
                                  <td className="px-4 py-3 font-medium text-white">
                                    {c.name}
                                  </td>
                                  <td className="max-w-[200px] truncate px-4 py-3">
                                    {c.description}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3">
                                    {c.price
                                      ? `R$ ${Number(c.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                                      : "-"}
                                  </td>
                                  <td className="flex justify-end px-4 py-3">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                                      onClick={() => removeCombo(c.id)}
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 7 && (
                <div className="space-y-5">
                  {/* Seletor de tipo */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-gray-500">
                      Tipo da Chave Pix *
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"].map(
                        (type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() =>
                              setPixConfig({
                                ...pixConfig,
                                pixKeyType: type,
                                pixKey: "",
                              })
                            }
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                              pixConfig.pixKeyType === type
                                ? "border-[#2C78B2] bg-[#2C78B2] text-white"
                                : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                            }`}
                          >
                            {type === "PHONE"
                              ? "Telefone"
                              : type === "RANDOM"
                                ? "Aleatória"
                                : type}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Input da chave */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-gray-500">
                      Sua Chave Pix *
                    </Label>
                    <Input
                      value={pixConfig.pixKey}
                      onChange={(e) =>
                        setPixConfig({ ...pixConfig, pixKey: e.target.value })
                      }
                      placeholder={
                        pixConfig.pixKeyType === "CPF"
                          ? "000.000.000-00"
                          : pixConfig.pixKeyType === "CNPJ"
                            ? "00.000.000/0000-00"
                            : pixConfig.pixKeyType === "EMAIL"
                              ? "seu@email.com"
                              : pixConfig.pixKeyType === "PHONE"
                                ? "+55 (00) 00000-0000"
                                : "Chave aleatória (UUID)"
                      }
                      className="border-white/5 bg-white/5"
                    />
                    <p className="text-[10px] text-gray-500">
                      Digite a mesma chave cadastrada no app do seu banco.
                    </p>
                  </div>

                  {/* Instituição bancária */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-gray-500">
                      Instituição bancária *
                    </Label>
                    <Input
                      value={pixConfig.pixBeneficiary}
                      onChange={(e) =>
                        setPixConfig({
                          ...pixConfig,
                          pixBeneficiary: e.target.value,
                        })
                      }
                      placeholder="Ex: Barbearia do Zé"
                      className="border-white/5 bg-white/5"
                    />
                    <p className="text-[10px] text-gray-500">
                      Este nome aparecerá para o cliente na hora do pagamento.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-6">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep((prev: number) => prev - 1)}
                  disabled={loading}
                  className="border-white/10 text-white hover:bg-white/5 hover:text-white"
                >
                  Voltar
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={loading}
                className="group min-w-[140px] bg-[#2C78B2] font-bold text-white hover:bg-[#1E5A8A]"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {currentStep === 7 ? "Finalizar Setup" : "Próximo Passo"}
                    <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
