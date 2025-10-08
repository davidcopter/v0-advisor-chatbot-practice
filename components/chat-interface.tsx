"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, StopCircle, ThumbsUp, ThumbsDown, Lightbulb, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

interface Persona {
  id: string
  name: string
  gender?: string
  age?: string
  occupation: string
  income: string
  assets: string
  risk: string
  lifestyle: string
  language: string
}

interface ChatInterfaceProps {
  persona: Persona
}

interface MessageFeedback {
  score: number
  strengths: string[]
  improvements: string[]
  recommendation: string
  penalties?: {
    offTopic: boolean
    tooShort: boolean
    unprofessional: boolean
    penaltyPoints: number
  }
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  feedback?: MessageFeedback
  emoji?: string
}

export function ChatInterface({ persona }: ChatInterfaceProps) {
  const router = useRouter()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isEndingChat, setIsEndingChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    console.log("[v0] Submitting message:", input.trim())

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      emoji: "",
    }

    setMessages((prev) => [...prev, assistantMessage])

    try {
      abortControllerRef.current = new AbortController()

      const requestPayload = {
        messages: [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        })),
        persona,
      }
      console.log("[v0] Sending request to /api/chat with payload:", {
        messageCount: requestPayload.messages.length,
        personaName: persona.name,
      })

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
        signal: abortControllerRef.current.signal,
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        let errorMessage = "Failed to get response"

        if (contentType?.includes("application/json")) {
          try {
            const errorData = await response.json()
            console.error("[v0] Error response data:", errorData)
            errorMessage = errorData.details || errorData.error || errorMessage
          } catch (jsonError) {
            console.error("[v0] Failed to parse JSON error response:", jsonError)
          }
        } else {
          try {
            const errorText = await response.text()
            console.error("[v0] Error response text:", errorText)
            errorMessage = errorText || errorMessage
          } catch (textError) {
            console.error("[v0] Failed to read error response text:", textError)
          }
        }

        throw new Error(errorMessage)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No reader available")
      }

      console.log("[v0] Starting to read stream")
      let accumulatedContent = ""
      let customerEmoji = ""
      let chunkCount = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log("[v0] Stream reading completed. Total chunks:", chunkCount)
          break
        }

        chunkCount++
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const content = JSON.parse(line.slice(2))
              accumulatedContent += content
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: accumulatedContent } : m)),
              )
            } catch (e) {
              console.warn("[v0] Failed to parse chunk:", line)
            }
          } else if (line.startsWith("emoji:")) {
            try {
              customerEmoji = JSON.parse(line.slice(6))
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMessage.id ? { ...m, emoji: customerEmoji } : m)),
              )
            } catch (e) {
              console.warn("[v0] Failed to parse emoji:", line)
            }
          }
        }
      }

      console.log("[v0] Accumulated content length:", accumulatedContent.length)
      console.log("[v0] Customer emoji:", customerEmoji)

      try {
        console.log("[v0] Requesting feedback for message")
        const feedbackResponse = await fetch("/api/feedback-realtime", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userMessage: userMessage.content,
            assistantMessage: accumulatedContent,
            conversationHistory: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            persona,
          }),
        })

        console.log("[v0] Feedback response status:", feedbackResponse.status)

        if (feedbackResponse.ok) {
          const feedbackData = await feedbackResponse.json()
          console.log("[v0] Feedback received:", feedbackData)
          setMessages((prev) =>
            prev.map((m) => (m.id === userMessage.id ? { ...m, feedback: feedbackData.feedback } : m)),
          )
        } else {
          console.error("[v0] Feedback request failed with status:", feedbackResponse.status)
        }
      } catch (feedbackError: any) {
        console.error("[v0] Failed to get feedback:", feedbackError.message)
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("[v0] Request aborted")
      } else {
        console.error("[v0] Chat error:", error.message)
        console.error("[v0] Error stack:", error.stack)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: `Error: ${error.message}. Please check the console for details.` }
              : m,
          ),
        )
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
    }
  }

  const handleEndChat = () => {
    setIsEndingChat(true)
    const conversationData = {
      language: persona.language,
      personaId: persona.id,
      personaName: persona.name,
      messages: messages,
      endedAt: new Date().toISOString(),
    }
    localStorage.setItem("lastConversation", JSON.stringify(conversationData))
    router.push(`/feedback/${persona.id}`)
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-6 py-8">
          {messages.length === 0 && (
            <div className="mb-8 rounded-lg bg-muted/50 p-6">
              <h3 className="mb-2 font-sans text-lg font-semibold text-foreground">
                You're chatting with {persona.name}
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                {persona.gender && (
                  <p>
                    <span className="font-medium">Gender:</span> {persona.gender}
                  </p>
                )}
                {persona.age && (
                  <p>
                    <span className="font-medium">Age:</span> {persona.age}
                  </p>
                )}
                <p>
                  <span className="font-medium">Background:</span> {persona.occupation} with {persona.income} annual
                  income
                </p>
                <p>
                  <span className="font-medium">Assets:</span> {persona.assets}
                </p>
                <p>
                  <span className="font-medium">Risk Tolerance:</span> {persona.risk}
                </p>
                <p>
                  <span className="font-medium">Profile:</span> {persona.lifestyle}
                </p>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Start the conversation by introducing yourself and asking about their financial goals for mutual fund
                investments.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id}>
                <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-card-foreground"
                    }`}
                  >
                    {message.role === "assistant" && message.emoji && (
                      <div className="mb-2 flex items-center gap-2 border-b border-border pb-2">
                        <span className="text-2xl" role="img" aria-label="customer emotion">
                          {message.emoji}
                        </span>
                        <span className="text-xs text-muted-foreground">Customer's feeling</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                </div>

                {message.role === "user" && message.feedback && (
                  <div className="mt-2 flex justify-end">
                    <div className="max-w-[80%] rounded-lg border border-accent bg-accent/10 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-accent-foreground" />
                        <span className="font-sans text-sm font-semibold text-accent-foreground">
                          Feedback - Score: {message.feedback.score}%
                        </span>
                      </div>

                      {message.feedback.penalties && message.feedback.penalties.penaltyPoints > 0 && (
                        <div className="mb-3 rounded border border-red-200 bg-red-50 p-2">
                          <div className="mb-1 text-xs font-semibold text-red-700">
                            Penalties Applied (-{message.feedback.penalties.penaltyPoints} points):
                          </div>
                          <ul className="ml-4 space-y-0.5 text-xs text-red-600">
                            {message.feedback.penalties.offTopic && (
                              <li>• Response didn't directly address the question</li>
                            )}
                            {message.feedback.penalties.tooShort && <li>• Response was too brief or lacked detail</li>}
                            {message.feedback.penalties.unprofessional && (
                              <li>• Unprofessional or impolite language detected</li>
                            )}
                          </ul>
                        </div>
                      )}

                      {message.feedback.strengths.length > 0 && (
                        <div className="mb-2">
                          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-green-600">
                            <ThumbsUp className="h-3 w-3" />
                            <span>Strengths:</span>
                          </div>
                          <ul className="ml-4 list-disc space-y-0.5 text-xs text-muted-foreground">
                            {message.feedback.strengths.map((strength, idx) => (
                              <li key={idx}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {message.feedback.improvements.length > 0 && (
                        <div className="mb-2">
                          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-orange-600">
                            <ThumbsDown className="h-3 w-3" />
                            <span>Areas to Improve:</span>
                          </div>
                          <ul className="ml-4 list-disc space-y-0.5 text-xs text-muted-foreground">
                            {message.feedback.improvements.map((improvement, idx) => (
                              <li key={idx}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="border-t border-accent/20 pt-2">
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          <span className="font-medium">Recommendation:</span> {message.feedback.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border bg-card">
        <div className="container mx-auto max-w-4xl px-6 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[60px] flex-1 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              disabled={isLoading}
            />
            <div className="flex flex-col gap-2">
              {isLoading ? (
                <Button
                  type="button"
                  onClick={handleStop}
                  variant="outline"
                  size="icon"
                  className="h-[60px] w-[60px] bg-transparent"
                >
                  <StopCircle className="h-5 w-5" />
                </Button>
              ) : (
                <Button type="submit" size="icon" className="h-[60px] w-[60px]" disabled={!input.trim()}>
                  <Send className="h-5 w-5" />
                </Button>
              )}
            </div>
          </form>
          {messages.length > 2 && (
            <div className="mt-3 flex justify-center">
              <Button variant="outline" onClick={handleEndChat} disabled={isEndingChat || isLoading}>
                {isEndingChat ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Feedback...
                  </>
                ) : (
                  "End Chat & Get Overall Feedback"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
