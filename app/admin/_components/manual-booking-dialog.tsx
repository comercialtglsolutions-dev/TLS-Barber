"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ptBR } from "date-fns/locale"
import { format } from "date-fns"
import { CalendarIcon, ChevronDown, Loader2Icon, PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/app/_providers/auth"

import { Button } from "@/app/_components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Calendar } from "@/app/_components/ui/calendar"
import { cn } from "@/app/_lib/utils"
import { ManualBookingSchema, manualBookingSchema } from "../_schemas"
import { createManualBooking } from "@/app/_actions/create-manual-booking"
import { getAvailableSlots } from "@/app/_actions/get-available-slots"

interface ManualBookingDialogProps {
  users: any[]
  services: any[]
  combos: any[]
}

const ManualBookingDialog = ({
  users,
  services,
  combos,
}: ManualBookingDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isTimeOpen, setIsTimeOpen] = useState(false)
  const form = useForm<ManualBookingSchema>({
    resolver: zodResolver(manualBookingSchema),
    defaultValues: {
      userId: "",
      serviceId: undefined,
      comboId: undefined,
      hour: "",
    },
  })

  const { profile } = useAuth()
  const [availableSlots, setAvailableSlots] = useState<string[]>([])

  const selectedDate = form.watch("date")

  useEffect(() => {
    if (!selectedDate) return
    const fetchBookings = async () => {
      const barbershopId = profile?.barbershopId
      if (!barbershopId) return

      const slots = await getAvailableSlots({
        date: selectedDate,
        barbershopId,
      })
      setAvailableSlots(slots)
    }
    fetchBookings()
  }, [selectedDate, profile?.barbershopId])

  // Reset form when dialog opens to ensure clean state
  useEffect(() => {
    if (isOpen) {
      form.reset({
        userId: "",
        serviceId: undefined,
        comboId: undefined,
        hour: "",
        date: undefined as any,
      })
    }
  }, [isOpen, form])

  const onSubmit = async (data: ManualBookingSchema) => {
    try {
      await createManualBooking(data)
      toast.success("Agendamento manual criado com sucesso!")
      setIsOpen(false)
      form.reset()
    } catch (error) {
      toast.error("Erro ao criar agendamento manual.")
    }
  }

  const getTimeSlots = () => {
    return availableSlots.filter((time) => {
      const now = new Date()
      if (selectedDate && selectedDate.toDateString() === now.toDateString()) {
        const [hours, minutes] = time.split(":").map(Number)
        const slotDate = new Date(selectedDate)
        slotDate.setHours(hours, minutes, 0, 0)
        return slotDate >= now
      }
      return true
    })
  }

  const isFormValid = !!(
    form.watch("userId") &&
    (form.watch("serviceId") || form.watch("comboId")) &&
    form.watch("date") &&
    form.watch("hour")
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 bg-[#3EABFD] px-2 text-xs text-white hover:bg-[#2e8acb] lg:w-auto lg:gap-2 lg:px-4 lg:text-sm">
          <PlusIcon className="h-5 w-5 lg:h-[18px] lg:w-[18px]" />
          Novo agendamento
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-1rem)] border-white/10 bg-[#1A1A1A] p-3 text-white sm:max-w-[425px] lg:p-6">
        <DialogHeader className="space-y-0.5 lg:space-y-2">
          <DialogTitle className="text-[clamp(0.95rem,4vw,1.125rem)] lg:text-xl">
            Novo agendamento manual
          </DialogTitle>
          <DialogDescription className="text-[10px] text-gray-400 lg:text-sm">
            Crie um agendamento direto no sistema sem passar pelo Stripe.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] lg:text-sm">
                    Cliente
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8 border-white/10 bg-[#222] text-xs lg:h-10 lg:text-sm">
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="border-white/10 bg-[#1A1A1A] text-white">
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 lg:gap-4">
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-[11px] lg:text-sm">
                      Serviço
                    </FormLabel>
                    <Select
                      disabled={!!form.watch("comboId")}
                      onValueChange={(value) => {
                        field.onChange(value)
                        form.setValue("comboId", undefined)
                      }}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 justify-start border-white/10 bg-[#222] text-left text-xs lg:h-10 lg:text-sm">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-white/10 bg-[#1A1A1A] text-white">
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comboId"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-[11px] lg:text-sm">
                      Combo
                    </FormLabel>
                    <Select
                      disabled={!!form.watch("serviceId")}
                      onValueChange={(value) => {
                        field.onChange(value)
                        form.setValue("serviceId", undefined)
                      }}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 justify-start border-white/10 bg-[#222] text-left text-xs lg:h-10 lg:text-sm">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-white/10 bg-[#1A1A1A] text-white">
                        {combos.map((combo) => (
                          <SelectItem key={combo.id} value={combo.id}>
                            {combo.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 lg:gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-[11px] lg:text-sm">
                      Data
                    </FormLabel>
                    <PopoverPrimitive.Root
                      open={isCalendarOpen}
                      onOpenChange={setIsCalendarOpen}
                    >
                      <PopoverPrimitive.Trigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant={"outline"}
                            className={cn(
                              "h-8 w-full border-white/10 bg-[#222] pl-3 text-left text-xs font-normal hover:bg-[#333] hover:text-white lg:h-10 lg:text-sm",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione</span>
                            )}
                            <CalendarIcon className="ml-auto h-3 w-3 opacity-50 lg:h-4 lg:w-4" />
                          </Button>
                        </FormControl>
                      </PopoverPrimitive.Trigger>
                      <PopoverPrimitive.Content
                        className="z-50 w-auto rounded-xl border border-white/10 bg-[#1A1A1A] p-0 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                        align="start"
                        sideOffset={4}
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(date)
                              setIsCalendarOpen(false)
                            }
                          }}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          locale={ptBR}
                          classNames={{
                            day_selected:
                              "bg-[#3EABFD] text-white hover:bg-[#3EABFD] hover:text-white rounded-xl",
                          }}
                        />
                      </PopoverPrimitive.Content>
                    </PopoverPrimitive.Root>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hour"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-[11px] lg:text-sm">
                      Horário
                    </FormLabel>
                    <PopoverPrimitive.Root
                      open={isTimeOpen}
                      onOpenChange={setIsTimeOpen}
                    >
                      <PopoverPrimitive.Trigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant={"outline"}
                            className={cn(
                              "h-8 w-full justify-between border-white/10 bg-[#222] px-3 text-left text-xs font-normal hover:bg-[#333] hover:text-white lg:h-10 lg:text-sm",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value || "Horário"}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverPrimitive.Trigger>
                      <PopoverPrimitive.Content
                        className="z-50 max-h-[200px] w-[var(--radix-popover-trigger-width)] overflow-y-auto rounded-md border border-white/10 bg-[#1A1A1A] p-0 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                        align="start"
                      >
                        <div className="p-1">
                          {getTimeSlots().map((time) => (
                            <Button
                              type="button"
                              key={time}
                              variant="ghost"
                              className="w-full justify-start text-left text-xs text-white hover:bg-[#3EABFD] hover:text-white lg:text-sm"
                              onClick={() => {
                                field.onChange(time)
                                setIsTimeOpen(false)
                              }}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </PopoverPrimitive.Content>
                    </PopoverPrimitive.Root>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex-row gap-2 pt-2 lg:pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="h-9 flex-1 border-white/10 text-white lg:h-10 lg:flex-none"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className={cn(
                  "h-9 flex-1 transition-all duration-300 lg:h-10 lg:flex-none",
                  isFormValid
                    ? "bg-[#3EABFD] text-white hover:bg-[#2e8acb]"
                    : "bg-primary text-black",
                )}
              >
                {form.formState.isSubmitting && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Agendar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default ManualBookingDialog
