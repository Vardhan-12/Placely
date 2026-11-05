// aiService.js - Calls Google Gemini API to summarize company experiences

const generateCompanySummary = async (companyName, experiences) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  // Sanitize experiences: include ONLY the allowed fields, strictly never author names or ids
  const sanitizedExperiences = experiences.map((exp) => {
    const rounds = Array.isArray(exp.rounds)
      ? exp.rounds.map((r) => ({
        type: r.type,
        durationMinutes: r.durationMinutes,
        topics: r.topics,
        difficulty: r.difficulty,
        notes: r.notes,
      }))
      : [];

    return {
      year: exp.year,
      role: exp.role,
      result: exp.result,
      difficulty: exp.difficulty,
      packageLPA: exp.packageLPA,
      rounds,
      tips: exp.tips,
      mistakes: exp.mistakes,
      resources: exp.resources,
    };
  });

  const prompt = `You are an expert career and interview advisor.
Analyze the following interview experiences for the company "${companyName}".
Use ONLY the provided data. Do NOT invent facts or extrapolate beyond what is given.

Experiences Data:
${JSON.stringify(sanitizedExperiences, null, 2)}

Return valid JSON ONLY (no markdown code blocks, no explanations, no text outside JSON) with this exact schema:
{
  "overview": "A concise summary of interview patterns, hiring bar, and overall experience",
  "commonRounds": [
    { "round": "Round name or type", "whatToExpect": "What candidates faced in this round" }
  ],
  "topTopics": [
    { "topic": "Topic or skill name", "frequency": "High / Medium / Low" }
  ],
  "difficultyAssessment": "Overall assessment of difficulty level and what makes it challenging",
  "topTips": [
    "Practical advice shared by candidates"
  ],
  "commonMistakes": [
    "Pitfalls candidates reported"
  ],
  "recommendedResources": [
    "Books, platforms, or resources recommended by candidates"
  ],
  "prepPlan": [
    "Step-by-step preparation suggestion based on the experiences"
  ]
}`;

  const callGemini = async (targetModel) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(targetModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
        signal: controller.signal,
      });
    } catch (netErr) {
      const isTimeout = netErr.name === "AbortError";
      const msg = isTimeout ? "Request timed out after 20s" : netErr.message;
      console.error(`[Gemini Error] ${msg}`);
      const err = new Error(msg);
      err.isTimeout = isTimeout;
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.ok) {
      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    let errBody = "";
    try {
      const errJson = await response.json();
      errBody = errJson?.error?.message || JSON.stringify(errJson);
    } catch (e) {
      errBody = await response.text();
    }
    console.error(`[Gemini Error] Status: ${response.status}, Message: ${errBody}`);

    const err = new Error(`AI service responded with status ${response.status}`);
    err.status = response.status;
    throw err;
  };

  const callGroq = async () => {
    const groqKey = process.env.GROQ_API_KEY;
    const groqModel = process.env.GROQ_MODEL;
    if (!groqKey) {
      throw new Error("GROQ_API_KEY not set");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let response;
    try {
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });
    } catch (netErr) {
      const isTimeout = netErr.name === "AbortError";
      const msg = isTimeout ? "Request timed out after 20s" : netErr.message;
      console.error(`[Groq Error] ${msg}`);
      throw new Error(msg);
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.ok) {
      const data = await response.json();
      return data?.choices?.[0]?.message?.content || "";
    }

    let errBody = "";
    try {
      const errJson = await response.json();
      errBody = errJson?.error?.message || JSON.stringify(errJson);
    } catch (e) {
      errBody = await response.text();
    }
    console.error(`[Groq Error] Status: ${response.status}, Message: ${errBody}`);

    const err = new Error(`Groq service responded with status ${response.status}`);
    err.status = response.status;
    throw err;
  };

  let candidateText = "";

  // Step 1: Gemini attempt 1, and 1 retry on 503/429/timeout after 2s
  try {
    candidateText = await callGemini(model);
  } catch (err1) {
    if (err1.status === 503 || err1.status === 429 || err1.isTimeout) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        candidateText = await callGemini(model);
      } catch (err2) {
        // Fallback model if available
        const fallbackModel = process.env.GEMINI_FALLBACK_MODEL;
        if (fallbackModel && fallbackModel.trim()) {
          try {
            candidateText = await callGemini(fallbackModel.trim());
          } catch (fallbackErr) {
            // Handled below by Groq
          }
        }
      }
    } else {
      const fallbackModel = process.env.GEMINI_FALLBACK_MODEL;
      if (fallbackModel && fallbackModel.trim()) {
        try {
          candidateText = await callGemini(fallbackModel.trim());
        } catch (fallbackErr) {
          // Handled below by Groq
        }
      }
    }
  }

  // Step 2: Groq fallback if Gemini did not produce text
  if (!candidateText && process.env.GROQ_API_KEY) {
    try {
      candidateText = await callGroq();
    } catch (groqErr) {
      // Both providers failed
    }
  }

  if (!candidateText) {
    throw new Error("Empty response received from AI service");
  }

  // Strip code fences if returned despite prompt
  const cleanJson = candidateText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleanJson);
    return parsed;
  } catch (parseErr) {
    throw new Error("Failed to parse AI response into valid JSON");
  }
};

module.exports = {
  generateCompanySummary,
};

