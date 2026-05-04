"use client"

import { Button } from "./ui/button"
import { LogInIcon } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog"
import SignInDialog from "./sign-in-dialog"
import { Avatar, AvatarImage } from "./ui/avatar"
import { useAuth } from "../_providers/auth"

const UserIcon = () => {
  const { user } = useAuth()

  return (
    <div className="flex items-center justify-between gap-3 border-b border-solid py-5">
      {user ? (
        <div className="flex items-center gap-2">
          <Avatar className="border border-white/10">
            <AvatarImage src={user?.user_metadata?.avatar_url ?? ""} />
          </Avatar>

          <div>
            <p className="font-bold text-white">
              {user?.user_metadata?.full_name ||
                user?.user_metadata?.name ||
                user?.email?.split("@")[0]}
            </p>
            <p className="text-xs text-white">{user?.email}</p>
          </div>
        </div>
      ) : (
        <>
          <h2 className="font-bold text-white">Olá, faça seu login!</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon">
                <LogInIcon color="#FFFFFF" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[90%] rounded-2xl border border-white/10 bg-[#1A1A1A] p-6 shadow-2xl">
              <SignInDialog />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
export default UserIcon
