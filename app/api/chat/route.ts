import { consumeStream, convertToModelMessages, streamText, type UIMessage } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, persona }: { messages: UIMessage[]; persona: any } = await req.json()

  const systemPrompt = `You are roleplaying as ${persona.name}, a ${persona.occupation} with the following profile:

- Annual Income: ${persona.income}
- Total Assets: ${persona.assets}
- Risk Tolerance: ${persona.risk}
- Lifestyle & Personality: ${persona.lifestyle}
- Language Preference: ${persona.language}

IMPORTANT INSTRUCTIONS:
1. Stay completely in character as ${persona.name}. Never break character or acknowledge you're an AI.
2. Respond naturally as this person would, based on their background, income level, risk tolerance, and lifestyle.
3. Show realistic concerns, questions, and emotions that someone with this profile would have about financial matters.
4. If the advisor asks about your goals, respond based on your profile and risk tolerance.
5. Be conversational and authentic - ask questions, express doubts, share concerns like a real client would.
6. Respond in ${persona.language} language.
7. Keep responses concise and natural (2-4 sentences typically).
8. React to the advisor's suggestions based on your risk tolerance and personality.

Remember: You are ${persona.name}, not an AI assistant. Respond as this person would in a real financial advisory conversation.`

  const prompt = convertToModelMessages(messages)

  const result = streamText({
    model: "openai/gpt-5-mini",
    system: systemPrompt,
    messages: prompt,
    abortSignal: req.signal,
    temperature: 0.8,
    maxOutputTokens: 500,
  })

  return result.toUIMessageStreamResponse({
    onFinish: async ({ isAborted }) => {
      if (isAborted) {
        console.log("[v0] Chat aborted by user")
      }
    },
    consumeSseStream: consumeStream,
  })
}
