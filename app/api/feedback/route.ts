import { generateObject } from "ai"
import { z } from "zod"

const feedbackSchema = z.object({
  overallScore: z.number().min(0).max(100).describe("Overall performance score from 0-100"),
  categories: z
    .array(
      z.object({
        name: z.string().describe("Category name"),
        score: z.number().min(0).max(100).describe("Score for this category"),
        feedback: z.string().describe("Detailed feedback for this category"),
        trend: z.enum(["up", "down", "neutral"]).describe("Performance trend indicator"),
      }),
    )
    .describe("Performance breakdown by category"),
  strengths: z.array(z.string()).describe("Key strengths demonstrated in the conversation"),
  improvements: z.array(z.string()).describe("Areas that need improvement"),
  summary: z.string().describe("Overall summary of the advisor's performance"),
})

export async function POST(req: Request) {
  const { conversation } = await req.json()

  const conversationText = conversation.messages
    .map((msg: any) => {
      const role = msg.role === "user" ? "Advisor" : "Client"
      const text = msg.parts.find((p: any) => p.type === "text")?.text || ""
      return `${role}: ${text}`
    })
    .join("\n\n")

  const prompt = `You are an expert financial advisory coach evaluating an advisor's practice conversation with a client persona.

CLIENT PERSONA:
${JSON.stringify(conversation.persona || {}, null, 2)}

CONVERSATION TRANSCRIPT:
${conversationText}

Analyze the advisor's performance across these categories:
1. Rapport Building - How well did they establish trust and connection?
2. Active Listening - Did they ask clarifying questions and show understanding?
3. Needs Assessment - How effectively did they identify the client's goals and concerns?
4. Product Knowledge - Did they demonstrate expertise and provide relevant information?
5. Communication Clarity - Were explanations clear and jargon-free?
6. Objection Handling - How well did they address concerns or hesitations?

Provide:
- An overall score (0-100)
- Individual category scores with specific feedback
- 3-4 key strengths
- 3-4 areas for improvement
- A summary paragraph

Be constructive, specific, and actionable in your feedback.`

  const { object } = await generateObject({
    model: "openai/gpt-5-mini",
    schema: feedbackSchema,
    prompt,
    temperature: 0.7,
  })

  return Response.json({ feedback: object })
}
