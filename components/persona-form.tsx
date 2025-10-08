"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const CELEBRITY_PERSONAS = [
  {
    name: "Tech Entrepreneur",
    occupation: "Software Company CEO",
    income: "$500,000",
    assets: "$2,500,000",
    risk: "Aggressive",
    lifestyle: "Fast-paced, innovation-focused, values growth over stability",
  },
  {
    name: "Retired Teacher",
    occupation: "Retired Educator",
    income: "$45,000",
    assets: "$800,000",
    risk: "Conservative",
    lifestyle: "Stable, community-oriented, values security and legacy",
  },
  {
    name: "Young Professional",
    occupation: "Marketing Manager",
    income: "$85,000",
    assets: "$150,000",
    risk: "Moderate",
    lifestyle: "Career-focused, social, balancing present enjoyment with future planning",
  },
]

export function PersonaForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    occupation: "",
    income: "",
    assets: "",
    risk: "",
    lifestyle: "",
    language: "English",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Store persona in localStorage for now
    const personas = JSON.parse(localStorage.getItem("personas") || "[]")
    const newPersona = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
    }
    personas.push(newPersona)
    localStorage.setItem("personas", JSON.stringify(personas))

    // Navigate to chat
    router.push(`/chat/${newPersona.id}`)
  }

  const loadCelebrityPersona = (persona: (typeof CELEBRITY_PERSONAS)[0]) => {
    setFormData({
      ...formData,
      name: persona.name,
      occupation: persona.occupation,
      income: persona.income,
      assets: persona.assets,
      risk: persona.risk,
      lifestyle: persona.lifestyle,
    })
  }

  return (
    <Card className="p-8">
      <Tabs defaultValue="custom" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="custom">Custom Persona</TabsTrigger>
          <TabsTrigger value="preset">Preset Personas</TabsTrigger>
        </TabsList>

        <TabsContent value="custom" className="mt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  placeholder="Software Engineer"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="income">Annual Income</Label>
                <Input
                  id="income"
                  placeholder="$120,000"
                  value={formData.income}
                  onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assets">Total Assets</Label>
                <Input
                  id="assets"
                  placeholder="$500,000"
                  value={formData.assets}
                  onChange={(e) => setFormData({ ...formData, assets: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="risk">Risk Tolerance</Label>
                <Select
                  value={formData.risk}
                  onValueChange={(value) => setFormData({ ...formData, risk: value })}
                  required
                >
                  <SelectTrigger id="risk">
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Conservative">Conservative</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="Aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language Preference</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                    <SelectItem value="Mandarin">Mandarin</SelectItem>
                    <SelectItem value="Japanese">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lifestyle">Lifestyle & Personality</Label>
              <Textarea
                id="lifestyle"
                placeholder="Describe their lifestyle, goals, concerns, and personality traits..."
                value={formData.lifestyle}
                onChange={(e) => setFormData({ ...formData, lifestyle: e.target.value })}
                rows={4}
                required
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Persona & Start Chat"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="preset" className="mt-6">
          <div className="space-y-4">
            {CELEBRITY_PERSONAS.map((persona) => (
              <Card
                key={persona.name}
                className="cursor-pointer p-6 transition-colors hover:bg-accent/5"
                onClick={() => loadCelebrityPersona(persona)}
              >
                <h3 className="mb-2 font-sans text-lg font-semibold text-card-foreground">{persona.name}</h3>
                <div className="mb-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                  <div>
                    <span className="font-medium">Occupation:</span> {persona.occupation}
                  </div>
                  <div>
                    <span className="font-medium">Income:</span> {persona.income}
                  </div>
                  <div>
                    <span className="font-medium">Assets:</span> {persona.assets}
                  </div>
                  <div>
                    <span className="font-medium">Risk:</span> {persona.risk}
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{persona.lifestyle}</p>
              </Card>
            ))}
            <p className="text-center text-sm text-muted-foreground">
              Click a preset to load it into the custom form, then customize as needed.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
