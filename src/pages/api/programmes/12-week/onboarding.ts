import type { APIRoute } from "astro";
import { createSupabaseAdmin } from "../../../../lib/supabase";
import { getUserEntitlements } from "../../../../lib/access";

export const POST: APIRoute = async ({ locals, request }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: "Please sign in before submitting." }), { status: 401 });

  const entitlements = await getUserEntitlements(user.id, locals.supabase);
  if (!entitlements.hasProgramme) return new Response(JSON.stringify({ error: "No eligible programme purchase was found." }), { status: 403 });

  const data = await request.formData();
  const name = data.get("name")?.toString().trim() ?? "";
  const email = data.get("email")?.toString().trim().toLowerCase() ?? "";
  const age = Number(data.get("age"));
  const weight = Number(data.get("weight"));
  const height = Number(data.get("height"));
  const gender = data.get("gender")?.toString().trim() ?? "";
  const experience = data.get("experience")?.toString().trim() ?? "";
  const trainingDays = data.get("training_days_available")?.toString().trim() ?? "";
  const goal = data.get("goal")?.toString().trim() ?? "";
  const context = data.get("context")?.toString().trim() ?? "";
  const orderReference = data.get("order_reference")?.toString() || null;

  if (!name || !email || !Number.isInteger(age) || age < 16 || age > 99 || !weight || !height || !gender || !experience || !trainingDays || !goal || !context) {
    return new Response(JSON.stringify({ error: "Please complete every field." }), { status: 400 });
  }

  const onboardingContext = [
    `Weight: ${weight} kg`,
    `Height: ${height} cm`,
    `Gender: ${gender}`,
    `Available training days: ${trainingDays}`,
    `Further comments: ${context}`,
  ].join("\n");

  const admin = createSupabaseAdmin();
  const { error: saveError } = await admin.from("programme_onboarding").upsert({
    user_id: user.id,
    order_reference: orderReference,
    name,
    email,
    age,
    experience,
    goal,
    context: onboardingContext,
    status: "submitted",
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (saveError) {
    console.error("[programme/onboarding] Failed to save", saveError);
    return new Response(JSON.stringify({ error: "We couldn't save your details. Please try again." }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
};
