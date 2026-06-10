import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const API_KEY = Deno.env.get("API_KEY");
    if (!API_KEY) throw new Error("API_KEY is not configured");

    const response = await fetch("https://ai.gateway.supabase.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are IntelliResolve AI Assistant — a helpful chatbot embedded in a complaint management system for educational institutions. Your job is to:

1. Help students write clear, detailed complaint descriptions that will be properly categorized by the AI engine.
2. Suggest improvements to complaint text for better classification.
3. Answer questions about complaint categories (academic, administrative, hostel, technical, infrastructure).
4. Explain how the complaint system works — submission, AI classification, routing, SLA tracking, resolution.
5. Provide tips on what makes a good complaint (specific details, dates, evidence, clear desired outcome).

Key categories and their keywords:
- Academic: exams, marks, grades, professors, lectures, assignments, syllabus, attendance
- Administrative: fees, certificates, documents, admissions, scholarships, registration
- Hostel: rooms, mess/food, water, electricity, cleanliness, WiFi, maintenance
- Technical: portal, website, login, passwords, system errors, app issues
- Infrastructure: buildings, roads, parking, lighting, AC, projectors, canteen, gym

Tips you should share:
- Be specific: mention dates, times, locations, people involved
- Describe impact: how it affects studies/daily life
- State desired outcome: what resolution you expect
- Attach evidence if possible (photos, screenshots)
- Avoid vague language — specific keywords help AI classify better

Keep responses concise and helpful. Use markdown formatting. If a student shares a draft complaint, suggest improvements.`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact your administrator." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
