export const maxDuration = 30

export async function POST(req: Request) {
  console.log("[v0] Chat API called")

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("[v0] OpenAI API key is missing")
      return new Response(JSON.stringify({ error: "OpenAI API key is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
    console.log("[v0] OpenAI API key is configured")

    let OpenAI
    try {
      OpenAI = (await import("openai")).default
      console.log("[v0] OpenAI module loaded successfully")
    } catch (importError: any) {
      console.error("[v0] Failed to import OpenAI:", importError)
      return new Response(
        JSON.stringify({
          error: "Failed to load OpenAI library",
          details: importError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    let openai
    try {
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
      console.log("[v0] OpenAI client initialized")
    } catch (initError: any) {
      console.error("[v0] Failed to initialize OpenAI client:", initError)
      return new Response(
        JSON.stringify({
          error: "Failed to initialize OpenAI client",
          details: initError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    let body
    try {
      body = await req.json()
      console.log("[v0] Request body parsed successfully")
    } catch (parseError: any) {
      console.error("[v0] Failed to parse request body:", parseError)
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { messages, persona } = body

    if (!messages || !persona) {
      console.error("[v0] Missing required fields. Messages:", !!messages, "Persona:", !!persona)
      return new Response(JSON.stringify({ error: "Missing required fields: messages and persona" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }
    console.log("[v0] Request validation passed. Messages count:", messages.length)

    const systemPrompt = `You are roleplaying as ${persona.name}, a client seeking financial advice about mutual fund investments. Your profile:

- Name: ${persona.name}
- Age: ${persona.age || "Not specified"}
- Gender: ${persona.gender || "Not specified"}
- Occupation: ${persona.occupation}
- Annual Income: ${persona.income}
- Total Assets: ${persona.assets}
- Risk Tolerance: ${persona.risk}
- Lifestyle & Personality: ${persona.lifestyle}
- Language Preference: ${persona.language}

IMPORTANT INSTRUCTIONS:
1. You are a CLIENT consulting with a financial advisor about investing in mutual funds. You are NOT the advisor.
2. Stay completely in character as ${persona.name}. Never break character or acknowledge you're an AI.
3. You are seeking advice and guidance about mutual fund investments based on your financial situation.
4. Show realistic concerns, questions, and emotions about investing your money.
5. Ask questions about mutual funds, fees, risks, returns, and how they fit your goals.
6. Express doubts, seek clarification, and share your financial worries naturally.
7. React to the advisor's suggestions based on your risk tolerance:
   - Conservative: Prefer stability, worried about losses, ask about safe options
   - Moderate: Balance growth and safety, open to some risk
   - Aggressive: Seek high returns, willing to take risks, interested in growth funds
8. Respond in ${persona.language} language.
9. Keep responses concise and natural (2-4 sentences typically).
10. Share relevant details about your financial goals, timeline, and concerns when appropriate.

Remember: You are ${persona.name}, a real person seeking financial advice, not an AI assistant. Be authentic, curious, and sometimes uncertain like a real client would be.`

    const openaiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content || "",
      })),
    ]

    console.log("[v0] Calling OpenAI API with", openaiMessages.length, "messages")

    let stream
    try {
      stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: openaiMessages,
        temperature: 0.8,
        max_tokens: 500,
        stream: true,
      })
      console.log("[v0] OpenAI stream created successfully")
    } catch (openaiError: any) {
      console.error("[v0] OpenAI API error:", openaiError)
      return new Response(
        JSON.stringify({
          error: "OpenAI API error",
          details: openaiError.message || "Failed to create chat completion",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          console.log("[v0] Starting stream processing")
          let chunkCount = 0
          for await (const chunk of stream) {
            chunkCount++
            const content = chunk.choices[0]?.delta?.content || ""
            if (content) {
              const data = `0:${JSON.stringify(content)}\n`
              controller.enqueue(encoder.encode(data))
            }
          }
          console.log("[v0] Stream completed. Total chunks:", chunkCount)
          controller.close()
        } catch (error: any) {
          console.error("[v0] Stream error:", error)
          controller.error(error)
        }
      },
    })

    console.log("[v0] Returning stream response")
    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    })
  } catch (error: any) {
    console.error("[v0] Unexpected error in chat API:", error)
    console.error("[v0] Error stack:", error.stack)
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred",
        details: error.stack || "No additional details available",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
