"use client"

import React, { useState, useRef, ChangeEvent } from "react"
import { Button } from "@/app/_components/ui/button"
import { ImageIcon, Loader2Icon, XIcon } from "lucide-react"
import { uploadImage } from "@/app/_actions/upload-image"
import { toast } from "sonner"
import Image from "next/image"

interface ImageUploadProps {
  value?: string
  // eslint-disable-next-line no-unused-vars
  onChange: (url: string) => void
  disabled?: boolean
}

const ImageUpload = ({ value, onChange, disabled }: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 10MB")
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", file)

      const url = await uploadImage(formData)
      onChange(url)
      toast.success("Imagem enviada com sucesso!")
    } catch (error) {
      toast.error("Erro ao enviar imagem.")
    } finally {
      setIsUploading(false)
    }
  }

  const onRemove = () => {
    onChange("")
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative h-[100px] w-[100px] overflow-hidden rounded-md border border-white/10 lg:h-[150px] lg:w-[150px]">
            <div className="absolute right-1 top-1 z-10">
              <Button
                type="button"
                onClick={onRemove}
                variant="destructive"
                size="icon"
                className="h-6 w-6"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <Image
              fill
              src={value}
              alt="Preview"
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={`flex h-[100px] w-[100px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-white/10 transition hover:bg-white/5 lg:h-[150px] lg:w-[150px] ${disabled ? "cursor-not-allowed opacity-50" : ""} `}
          >
            {isUploading ? (
              <Loader2Icon className="h-6 w-6 animate-spin text-primary lg:h-8 lg:w-8" />
            ) : (
              <>
                <ImageIcon className="h-6 w-6 text-gray-400 lg:h-8 lg:w-8" />
                <span className="text-[10px] text-gray-400 lg:text-xs">
                  Upload Imagem
                </span>
              </>
            )}
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>
      <p className="text-[10px] italic text-gray-400">
        * Recomendado: 800x800px, máx 10MB.
      </p>
    </div>
  )
}

export default ImageUpload
