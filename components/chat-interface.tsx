"use client"

import type React from "react"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, StopCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

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

interface ChatInterfaceProps {
  persona: Persona
}

export function ChatInterface({ persona }: ChatInterfaceProps) {
  const router = useRouter()
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, stop } = useChat<UIMessage>({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      headers: {
        "X-Persona-Id": persona.id,
      },
    }),
    body: {
      persona,
    },
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status === "in_progress") return

    sendMessage({ text: input })
    setInput("")
  }

  const handleEndChat = () => {
    // Store conversation for feedback
    const conversationData = {
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
                Start the conversation by introducing yourself and asking about their financial goals.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-card-foreground"
                  }`}
                >
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      return (
                        <p key={index} className="whitespace-pre-wrap leading-relaxed">
                          {part.text}
                        </p>
                      )
                    }
                    return null
                  })}
                </div>
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
              disabled={status === "in_progress"}
            />
            <div className="flex flex-col gap-2">
              {status === "in_progress" ? (
                <Button
                  type="button"
                  onClick={stop}
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
              <Button variant="outline" onClick={handleEndChat}>
                End Chat & Get Feedback
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
