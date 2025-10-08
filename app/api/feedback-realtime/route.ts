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

    // Create a prompt to analyze the advisor's message
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

ADVISOR'S MESSAGE:
"${userMessage}"

CLIENT'S RESPONSE:
"${assistantMessage}"

Analyze the advisor's message and provide feedback in the following JSON format:
{
  "score": <number 0-100>,
  "strengths": [<array of 1-3 specific strengths>],
  "improvements": [<array of 1-3 specific areas to improve>],
  "recommendation": "<one specific actionable recommendation for the next message>"
}

Evaluate based on:
1. Rapport building and empathy
2. Understanding client needs and risk tolerance
3. Clear communication about mutual funds
4. Asking relevant questions
5. Professional tone and confidence
6. Addressing client concerns appropriately

Be specific and constructive. Focus on what the advisor did well and what they could improve.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert financial advisory coach. Provide constructive, specific feedback in valid JSON format only.",
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
