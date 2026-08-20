const FREE_MODELS = [
  "openrouter/free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "poolside/laguna-s-2.1:free"
];

export async function resolveVehicle(intent: string, systemPrompt: string) {
  const key = process.env.OPENROUTER_API_KEY;
  console.log("DEBUG key present:", !!key, "length:", key ? key.length : 0);

  if (!key) throw new Error("OPENROUTER_API_KEY missing");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com",
      "X-Title": "GFSA Interactive"
    },
    body: JSON.stringify({
      models: FREE_MODELS,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: intent }
      ],
      response_format: { type: "json_object" },
      temperature: 0.15
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty LLM response");

  return {
    resolution: JSON.parse(content),
    modelUsed: data.model
  };
}
