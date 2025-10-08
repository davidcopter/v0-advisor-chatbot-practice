"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, TrendingUp, TrendingDown, Minus, RotateCcw } from "lucide-react"
import Link from "next/link"

interface FeedbackData {
  overallScore: number
  categories: {
    name: string
    score: number
    feedback: string
    trend: "up" | "down" | "neutral"
  }[]
  strengths: string[]
  improvements: string[]
  summary: string
}

export default function FeedbackPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [personaName, setPersonaName] = useState("")

  useEffect(() => {
    const generateFeedback = async () => {
      const conversationData = localStorage.getItem("lastConversation")
      if (!conversationData) {
        router.push("/personas")
        return
      }

      const conversation = JSON.parse(conversationData)
      setPersonaName(conversation.personaName)

      try {
        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation }),
        })

        const data = await response.json()
        setFeedback(data.feedback)
      } catch (error) {
        console.error("Error generating feedback:", error)
      } finally {
        setLoading(false)
      }
    }

    generateFeedback()
  }, [params.id, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Analyzing your conversation...</p>
        </div>
      </div>
    )
  }

  if (!feedback) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Unable to generate feedback</p>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 80) return "Very Good"
    if (score >= 70) return "Good"
    if (score >= 60) return "Fair"
    return "Needs Improvement"
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/personas">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-sans text-2xl font-semibold text-foreground">Performance Feedback</h1>
          </div>
          <Link href={`/chat/${params.id}`}>
            <Button variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Practice Again
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 text-center">
          <p className="mb-4 text-muted-foreground">Conversation with {personaName}</p>
          <div className="mb-2">
            <span className={`font-sans text-6xl font-bold ${getScoreColor(feedback.overallScore)}`}>
              {feedback.overallScore}%
            </span>
          </div>
          <p className="text-xl font-medium text-foreground">{getScoreLabel(feedback.overallScore)}</p>
        </div>

        <Card className="mb-8 p-6">
          <h2 className="mb-4 font-sans text-xl font-semibold text-card-foreground">Overall Summary</h2>
          <p className="leading-relaxed text-muted-foreground">{feedback.summary}</p>
        </Card>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-4 font-sans text-lg font-semibold text-card-foreground">Key Strengths</h3>
            <ul className="space-y-2">
              {feedback.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-sm leading-relaxed">
                  <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                  <span className="text-muted-foreground">{strength}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 font-sans text-lg font-semibold text-card-foreground">Areas for Improvement</h3>
            <ul className="space-y-2">
              {feedback.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-2 text-sm leading-relaxed">
                  <TrendingDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600" />
                  <span className="text-muted-foreground">{improvement}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="font-sans text-2xl font-semibold text-foreground">Detailed Breakdown</h2>
          {feedback.categories.map((category, index) => (
            <Card key={index} className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-sans text-lg font-semibold text-card-foreground">{category.name}</h3>
                  {category.trend === "up" && <TrendingUp className="h-5 w-5 text-green-600" />}
                  {category.trend === "down" && <TrendingDown className="h-5 w-5 text-red-600" />}
                  {category.trend === "neutral" && <Minus className="h-5 w-5 text-muted-foreground" />}
                </div>
                <span className={`font-sans text-2xl font-bold ${getScoreColor(category.score)}`}>
                  {category.score}%
                </span>
              </div>
              <Progress value={category.score} className="mb-4 h-2" />
              <p className="leading-relaxed text-muted-foreground">{category.feedback}</p>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Link href="/personas">
            <Button variant="outline" size="lg">
              Back to Personas
            </Button>
          </Link>
          <Link href={`/chat/${params.id}`}>
            <Button size="lg">Practice Again</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
