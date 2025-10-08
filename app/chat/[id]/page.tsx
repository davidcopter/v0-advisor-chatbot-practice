"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChatInterface } from "@/components/chat-interface"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Persona {
  id: string
  name: string
  occupation: string
  income: string
  assets: string
  risk: string
  lifestyle: string
  language: string
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const [persona, setPersona] = useState<Persona | null>(null)

  useEffect(() => {
    const personas = JSON.parse(localStorage.getItem("personas") || "[]")
    const found = personas.find((p: Persona) => p.id === params.id)
    if (found) {
      setPersona(found)
    } else {
      router.push("/personas")
    }
  }, [params.id, router])

  if (!persona) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/personas">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-sans text-xl font-semibold text-foreground">{persona.name}</h1>
              <p className="text-sm text-muted-foreground">{persona.occupation}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1">{persona.risk} Risk</span>
            <span className="rounded-full bg-muted px-3 py-1">{persona.language}</span>
          </div>
        </div>
      </header>

      <ChatInterface persona={persona} />
    </div>
  )
}
