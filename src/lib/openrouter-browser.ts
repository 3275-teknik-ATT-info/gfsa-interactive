const FREE_MODELS = [
  "openrouter/free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "poolside/laguna-s-2.1:free"
];

export async function resolveVehicle(intent: string, systemPrompt: string) {
  // Ask every time – do not store in localStorage
  const key = prompt("Paste OpenRouter key (sk-or-v1-...) – it will not be saved");
  if (!key || !key.startsWith("sk-or-v1-")) {
    throw new Error("Valid OpenRouter key required");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
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
