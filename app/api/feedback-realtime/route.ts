import OpenAI from "openai"

export const maxDuration = 30

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OpenAI API key is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { userMessage, assistantMessage, conversationHistory, persona } = await req.json()

    const language = persona.language || "English"

    const analysisPrompt = `You are an expert financial advisory coach evaluating an advisor's communication with a client.

CLIENT PROFILE:
- Name: ${persona.name}
- Age: ${persona.age || "Not specified"}
- Gender: ${persona.gender || "Not specified"}
- Occupation: ${persona.occupation}
- Income: ${persona.income}
- Assets: ${persona.assets}
- Risk Tolerance: ${persona.risk}
- Profile: ${persona.lifestyle}
- Language Preference: ${language}

ADVISOR'S MESSAGE:
"${userMessage}"

CLIENT'S RESPONSE:
"${assistantMessage}"

IMPORTANT: Provide ALL feedback content in ${language}. All text including strengths, improvements, and recommendations MUST be in ${language}.

Analyze the advisor's message and provide feedback in the following JSON format:
{
  "score": <number 0-100>,
  "strengths": [<array of 1-3 specific strengths IN ${language}>],
  "improvements": [<array of 1-3 specific areas to improve IN ${language}>],
  "recommendation": "<one specific actionable recommendation for the next message IN ${language}>",
  "penalties": {
    "offTopic": <boolean - true if answer doesn't match the question>,
    "tooShort": <boolean - true if answer is too brief>,
    "unprofessional": <boolean - true if impolite language was used>,
    "penaltyPoints": <total points deducted 0-30>
  }
}

Evaluate based on:
1. Rapport building and empathy
2. Understanding client needs and risk tolerance
3. Clear communication about mutual funds
4. Asking relevant questions
5. Professional tone and confidence
6. Addressing client concerns appropriately

PENALTY CRITERIA - Apply penalties for:
1. OFF-TOPIC RESPONSE (ตอบไม่ตรงคำถาม): Deduct 5-10 points if the advisor's answer doesn't directly address what the client asked or is irrelevant to their concern.
2. TOO SHORT RESPONSE (ตอบสั้นเกินไป): Deduct 3-7 points if the response is too brief (less than 2-3 sentences) or lacks sufficient detail to be helpful.
3. UNPROFESSIONAL LANGUAGE (ใช้คำไม่สุภาพ): Deduct 10-15 points if any impolite, rude, or unprofessional language is used.

Calculate the score by starting at 100, adding points for strengths, and deducting penalty points for violations. Be specific and constructive. ALL feedback text must be in ${language}.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert financial advisory coach. Provide constructive, specific feedback in valid JSON format only. ALL text content in your response MUST be in ${language}.`,
        },
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    })

    const feedbackText = completion.choices[0]?.message?.content || "{}"
    const feedback = JSON.parse(feedbackText)

    return new Response(
      JSON.stringify({
        feedback: {
          score: feedback.score || 70,
          strengths: feedback.strengths || [],
          improvements: feedback.improvements || [],
          recommendation: feedback.recommendation || "Continue building rapport with the client.",
          penalties: feedback.penalties || {
            offTopic: false,
            tooShort: false,
            unprofessional: false,
            penaltyPoints: 0,
          },
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error: any) {
    console.error("[v0] Feedback API error:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to generate feedback",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
