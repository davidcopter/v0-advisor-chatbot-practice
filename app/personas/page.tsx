"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, MessageSquare, Trash2 } from "lucide-react"

interface Persona {
  id: string
  name: string
  occupation: string
  income: string
  assets: string
  risk: string
  lifestyle: string
  language: string
  createdAt: string
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("personas")
    if (stored) {
      setPersonas(JSON.parse(stored))
    }
  }, [])

  const deletePersona = (id: string) => {
    const updated = personas.filter((p) => p.id !== id)
    setPersonas(updated)
    localStorage.setItem("personas", JSON.stringify(updated))
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="font-sans text-2xl font-semibold text-foreground">My Personas</h1>
          <Link href="/create-persona">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Persona
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {personas.length === 0 ? (
          <div className="mx-auto max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Plus className="h-10 w-10 text-muted-foreground" />
              </div>
            </div>
            <h2 className="mb-2 font-sans text-2xl font-semibold text-foreground">No personas yet</h2>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              Create your first client persona to start practicing your advisory conversations.
            </p>
            <Link href="/create-persona">
              <Button size="lg">Create Your First Persona</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {personas.map((persona) => (
              <Card key={persona.id} className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-sans text-xl font-semibold text-card-foreground">{persona.name}</h3>
                    <p className="text-sm text-muted-foreground">{persona.occupation}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deletePersona(persona.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Income:</span>
                    <span className="font-medium text-card-foreground">{persona.income}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assets:</span>
                    <span className="font-medium text-card-foreground">{persona.assets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk:</span>
                    <span className="font-medium text-card-foreground">{persona.risk}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Language:</span>
                    <span className="font-medium text-card-foreground">{persona.language}</span>
                  </div>
                </div>

                <Link href={`/chat/${persona.id}`}>
                  <Button className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Start Conversation
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
