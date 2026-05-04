"use server"

import { db } from "@/app/_lib/prisma"
import { decrypt } from "@/app/_lib/encryption"
import { createClient } from "../_lib/supabase/server"
import crypto from "crypto"
import QRCode from "qrcode"

export async function createItauPayment(params: {
  itemId: string
  type: "SERVICE" | "PRODUCT"
  method: "pix"
  metadata?: any
}) {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) throw new Error("Não autorizado")

  // 1. Get Item Data
  let title = ""
  let price = 0
  let barbershopId = ""

  if (params.type === "SERVICE") {
    if (params.itemId.startsWith("combined_")) {
      const ids = params.itemId.replace("combined_", "").split("_")
      const services = await db.service.findMany({ where: { id: { in: ids } } })
      const orderedServices = ids
        .map((id) => services.find((s) => s.id === id))
        .filter(Boolean) as any[]

      title = orderedServices.map((s) => s.name).join(" + ")
      price = orderedServices.reduce((acc, s) => acc + Number(s.price), 0)
      barbershopId = orderedServices[0]?.barbershopId || ""
    } else {
      const service = await db.service.findUnique({
        where: { id: params.itemId },
      })
      if (service) {
        title = service.name
        price = Number(service.price)
        barbershopId = service.barbershopId
      } else {
        const combo = (await db.combo.findUnique({
          where: { id: params.itemId },
        })) as any
        if (!combo) throw new Error("Serviço ou Combo não encontrado.")
        title = combo.name
        price = Number(combo.price)
        barbershopId = combo.barbershopId
      }
    }
  } else {
    const product = await db.product.findUnique({
      where: { id: params.itemId },
    })
    if (!product) throw new Error("Produto não encontrado")
    title = product.name
    price = Number(product.price)
    barbershopId = product.barbershopId
  }

  // 2. Get Credentials
  const credential = (await db.bankCredential.findFirst({
    where: {
      bank: { provider: "ITAU", barbershopId: barbershopId },
    },
    include: { bank: true },
  })) as any

  if (!credential || !credential.isEnabled) {
    throw new Error("Integração com Itaú não cadastrada ou desativada.")
  }

  const clientId = decrypt(credential.clientId)
  const clientSecret = decrypt(credential.clientSecret)
  const isSandbox = credential.environment === "SANDBOX"

  // URLs Itaú Sandbox (baseadas no portal do desenvolvedor)
  const AUTH_URL = isSandbox
    ? "https://sandbox.devportal.itau.com.br/itau-ep9-api-qrcode-pix-automatico-v1-externo/v1/oauth/token"
    : "https://sts.itau.com.br/api/oauth/token"

  const API_URL = isSandbox
    ? "https://sandbox.devportal.itau.com.br/itau-ep9-api-qrcode-pix-automatico-v1-externo/v1"
    : "https://recebimentos-pix.api.itau.com/qrcode-pix-automatico/v1"

  // 3. Auth OAuth2
  const authResponse = await fetch(AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  const authData = await authResponse.json()
  if (!authResponse.ok) {
    console.error("[Itaú Auth Error]:", authData)
    throw new Error(
      "Erro na autenticação com o Itaú. Verifique as credenciais.",
    )
  }

  const accessToken = authData.access_token

  // 4. Create Pix
  const txid = crypto.randomBytes(16).toString("hex")

  const payload = {
    calendario: {
      expiracao: 3600,
    },
    valor: {
      original: price.toFixed(2),
    },
    chave: "04085461000109", // Chave Pix (CNPJ de teste Itaú Sandbox)
    solicitacaoPagador: `Pagamento: ${title}`,
  }

  const paymentResponse = await fetch(`${API_URL}/cob/${txid}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const paymentData = await paymentResponse.json()
  if (!paymentResponse.ok) {
    console.error("[Itaú Payment Error]:", paymentData)
    throw new Error("Erro ao gerar cobrança no Itaú.")
  }

  // 5. Generate QR Code
  const pixCopiaECola = paymentData.pixCopiaECola
  const qrCodeBase64 = await QRCode.toDataURL(pixCopiaECola)

  return {
    id: paymentData.txid,
    qrCode: pixCopiaECola,
    qrCodeBase64: qrCodeBase64.split(",")[1], // Remove "data:image/png;base64,"
    amount: price,
    method: "pix",
  }
}
