import { PersonaForm } from "@/components/persona-form"

export default function CreatePersonaPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <h1 className="font-sans text-2xl font-semibold text-foreground">Create New Persona</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h2 className="font-sans text-3xl font-bold text-foreground">Build Your Client Persona</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              Create a detailed client profile to practice your advisory conversations. The more specific you are, the
              more realistic the interaction.
            </p>
          </div>

          <PersonaForm />
        </div>
      </main>
    </div>
  )
}
