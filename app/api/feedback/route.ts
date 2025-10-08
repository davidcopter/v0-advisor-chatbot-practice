export const maxDuration = 30

export async function POST(req: Request) {
  console.log("[v0] Feedback API called")

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("[v0] OpenAI API key is missing")
      return new Response(JSON.stringify({ error: "OpenAI API key is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

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

Analyze the advisor's performance comprehensively and return a JSON object with the following structure:

{
  "overallScore": <number 0-100>,
  "conversationSummary": "<brief summary of conversation flow and key topics>",
  "conversationTone": {
    "advisorTone": "<description of advisor's tone>",
    "clientTone": "<description of client's tone and engagement>",
    "overall": "<overall tone assessment>"
  },
  "customerSatisfaction": {
    "score": <number 0-100>,
    "indicators": ["<indicator 1>", "<indicator 2>", ...],
    "assessment": "<overall satisfaction assessment>"
  },
  "categories": [
    {
      "name": "Rapport Building",
      "score": <number 0-100>,
      "feedback": "<detailed feedback>",
      "trend": "up|down|neutral"
    },
    {
      "name": "Active Listening",
      "score": <number 0-100>,
      "feedback": "<detailed feedback>",
      "trend": "up|down|neutral"
    },
    {
      "name": "Needs Assessment",
      "score": <number 0-100>,
      "feedback": "<detailed feedback>",
      "trend": "up|down|neutral"
    },
    {
      "name": "Product Knowledge",
      "score": <number 0-100>,
      "feedback": "<detailed feedback>",
      "trend": "up|down|neutral"
    },
    {
      "name": "Communication Clarity",
      "score": <number 0-100>,
      "feedback": "<detailed feedback>",
      "trend": "up|down|neutral"
    },
    {
      "name": "Objection Handling",
      "score": <number 0-100>,
      "feedback": "<detailed feedback>",
      "trend": "up|down|neutral"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "improvements": ["<improvement 1>", "<improvement 2>", ...],
  "summary": "<comprehensive performance summary>"
}

Evaluation Guidelines:
1. CONVERSATION SUMMARY: Provide a brief overview of what was discussed and how the conversation flowed.
2. CONVERSATION TONE: Analyze the tone of both the advisor and client.
3. CUSTOMER SATISFACTION: Assess how satisfied the client appeared based on their responses.
4. PERFORMANCE CATEGORIES: Evaluate across the six areas listed above.
5. STRENGTHS & IMPROVEMENTS: Identify 3-4 key strengths and 3-4 areas for improvement.
6. OVERALL SUMMARY: Provide a comprehensive summary of the advisor's performance.

Be constructive, specific, and actionable in your feedback.`

    console.log("[v0] Calling OpenAI API for feedback generation")

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert financial advisory coach. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    })

    console.log("[v0] OpenAI response received")

    const feedbackText = completion.choices[0]?.message?.content
    if (!feedbackText) {
      throw new Error("No response from OpenAI")
    }

    const feedback = JSON.parse(feedbackText)
    console.log("[v0] Feedback generated successfully")

    return Response.json({ feedback })
  } catch (error: any) {
    console.error("[v0] Error generating feedback:", error)
    console.error("[v0] Error stack:", error.stack)
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to generate feedback",
        details: error.stack || "No additional details available",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
