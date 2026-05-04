"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card"
import { Button } from "@/app/_components/ui/button"
import { Trash2Icon, UserIcon } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
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
} from "@/app/_components/ui/alert-dialog"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/_components/ui/avatar"
import UpsertBarberDialog from "./upsert-barber-dialog"
import { deleteBarber } from "@/app/_actions/delete-barber"

interface BarbersTableProps {
  barbers: any[]
}

const BarbersTable = ({ barbers }: BarbersTableProps) => {
  const [selectedBarber, setSelectedBarber] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleDeleteClick = async (id: string) => {
    try {
      await deleteBarber(id)
      toast.success("Barbeiro removido com sucesso!")
    } catch (error) {
      toast.error("Erro ao remover barbeiro.")
    }
  }

  const handleCardClick = (barber: any) => {
    setSelectedBarber(barber)
    setIsDialogOpen(true)
  }

  return (
    <Card className="border-white/10 bg-[#1A1A1A]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[clamp(1rem,4vw,1.25rem)] text-white lg:text-xl">
          Equipe de Barbeiros
        </CardTitle>
        <UpsertBarberDialog />
      </CardHeader>
      <CardContent>
        {/* Mobile View - Cards */}
        <div className="flex flex-col gap-4 lg:hidden">
          {barbers.map((barber) => (
            <div
              key={barber.id}
              className="flex flex-col gap-3 rounded-lg border border-white/5 bg-[#222] p-4"
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex flex-1 cursor-pointer items-center gap-3"
                  onClick={() => handleCardClick(barber)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={barber.imageUrl} />
                    <AvatarFallback className="bg-[#1A1A1A]">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-white">{barber.name}</h3>
                    <span className="text-xs text-gray-400">
                      {barber.description || "Sem descrição"}
                    </span>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-white/10 bg-[#1A1A1A] text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir barbeiro?</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        Isso removerá &quot;{barber.name}&quot; da sua equipe
                        permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-white/10 bg-[#222] text-white">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteClick(barber.id)}
                        className="bg-red-500 text-white hover:bg-red-600"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {barbers.length === 0 && (
            <div className="py-10 text-center text-gray-400">
              Nenhum barbeiro cadastrado.
            </div>
          )}
        </div>

        {/* Mobile Edit Dialog */}
        {selectedBarber && (
          <UpsertBarberDialog
            defaultValues={{
              id: selectedBarber.id,
              name: selectedBarber.name,
              description: selectedBarber.description || "",
              imageUrl: selectedBarber.imageUrl || "",
            }}
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            hideTrigger={true}
          />
        )}

        {/* Desktop View - Table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-[#222] text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Profissional</th>
                <th className="px-4 py-3">Especialidade</th>
                <th className="px-4 py-3">Cadastrado em</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {barbers.map((barber) => (
                <tr key={barber.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={barber.imageUrl} />
                        <AvatarFallback className="bg-[#1A1A1A]">
                          <UserIcon className="h-4 w-4 text-gray-400" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-white">
                        {barber.name}
                      </span>
                    </div>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3">
                    {barber.description || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(barber.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="flex justify-end gap-2 px-4 py-3 text-right">
                    <UpsertBarberDialog
                      defaultValues={{
                        id: barber.id,
                        name: barber.name,
                        description: barber.description || "",
                        imageUrl: barber.imageUrl || "",
                      }}
                    />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-white/10 bg-[#1A1A1A] text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            Esta ação não pode ser desfeita. Isso removerá
                            &quot;{barber.name}&quot; da sua equipe.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-white/10 bg-[#222] text-white">
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteClick(barber.id)}
                            className="bg-red-500 text-white hover:bg-red-600"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
              {barbers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center">
                    Nenhum barbeiro cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default BarbersTable
