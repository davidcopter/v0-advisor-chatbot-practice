import { generateObject } from "ai"
import { z } from "zod"

const feedbackSchema = z.object({
  overallScore: z.number().min(0).max(100).describe("Overall performance score from 0-100"),
  conversationSummary: z.string().describe("Brief summary of the conversation flow and key topics discussed"),
  conversationTone: z
    .object({
      advisorTone: z.string().describe("Description of the advisor's tone (e.g., professional, empathetic, confident)"),
      clientTone: z.string().describe("Description of the client's tone and engagement level"),
      overall: z.string().describe("Overall tone assessment of the conversation"),
    })
    .describe("Analysis of conversation tone"),
  customerSatisfaction: z
    .object({
      score: z.number().min(0).max(100).describe("Estimated customer satisfaction score based on client responses"),
      indicators: z.array(z.string()).describe("Specific indicators of satisfaction or dissatisfaction"),
      assessment: z.string().describe("Overall assessment of how satisfied the client appeared"),
    })
    .describe("Customer satisfaction analysis"),
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
      return `${role}: ${msg.content}`
    })
    .join("\n\n")

  const prompt = `You are an expert financial advisory coach evaluating an advisor's practice conversation with a client persona.

CLIENT PERSONA:
Name: ${conversation.personaName}
${conversation.persona ? JSON.stringify(conversation.persona, null, 2) : ""}

CONVERSATION TRANSCRIPT:
${conversationText}

Analyze the advisor's performance comprehensively:

1. CONVERSATION SUMMARY: Provide a brief overview of what was discussed and how the conversation flowed.

2. CONVERSATION TONE: Analyze the tone of both the advisor and client:
   - How did the advisor come across? (professional, empathetic, pushy, etc.)
   - How engaged was the client? (interested, hesitant, confused, etc.)
   - What was the overall atmosphere of the conversation?

3. CUSTOMER SATISFACTION: Assess how satisfied the client appeared to be:
   - Based on the client's responses, estimate their satisfaction level (0-100)
   - What specific indicators suggest satisfaction or dissatisfaction?
   - Overall assessment of the client's experience

4. PERFORMANCE CATEGORIES: Evaluate across these areas:
   - Rapport Building: How well did they establish trust and connection?
   - Active Listening: Did they ask clarifying questions and show understanding?
   - Needs Assessment: How effectively did they identify the client's goals and concerns?
   - Product Knowledge: Did they demonstrate expertise about mutual funds?
   - Communication Clarity: Were explanations clear and jargon-free?
   - Objection Handling: How well did they address concerns or hesitations?

5. STRENGTHS & IMPROVEMENTS: Identify 3-4 key strengths and 3-4 areas for improvement.

6. OVERALL SUMMARY: Provide a comprehensive summary of the advisor's performance.

Be constructive, specific, and actionable in your feedback.`

  const { object } = await generateObject({
    model: "openai/gpt-4o-mini",
    schema: feedbackSchema,
    prompt,
    temperature: 0.7,
  })

  return Response.json({ feedback: object })
}
