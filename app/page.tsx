import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageSquare, Users, TrendingUp } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="font-sans text-2xl font-semibold text-foreground">AdvisorAI Practice</h1>
          <nav className="flex items-center gap-4">
            <Link href="/personas">
              <Button variant="ghost">My Personas</Button>
            </Link>
            <Link href="/create-persona">
              <Button>Create Persona</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-sans text-5xl font-bold leading-tight text-balance text-foreground">
            Practice conversations with AI-powered client personas
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Build confidence and refine your advisory skills through realistic conversations. Get instant feedback and
            performance scores to improve your client interactions.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/create-persona">
              <Button size="lg" className="text-base">
                Start Practicing
              </Button>
            </Link>
            <Link href="/personas">
              <Button size="lg" variant="outline" className="text-base bg-transparent">
                View Personas
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-24 grid gap-8 md:grid-cols-3">
          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-sans text-xl font-semibold text-card-foreground">Custom Personas</h3>
            <p className="leading-relaxed text-muted-foreground">
              Create detailed client personas with specific income, assets, risk profiles, and lifestyle preferences.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-sans text-xl font-semibold text-card-foreground">Realistic Conversations</h3>
            <p className="leading-relaxed text-muted-foreground">
              AI-powered personas respond naturally based on their profile, simulating real client interactions.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-sans text-xl font-semibold text-card-foreground">Performance Feedback</h3>
            <p className="leading-relaxed text-muted-foreground">
              Receive detailed feedback and scoring after each conversation to track your improvement.
            </p>
          </Card>
        </div>
      </main>
    </div>
  )
}
