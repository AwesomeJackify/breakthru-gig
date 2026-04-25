import type { APIRoute } from "astro";
import { stripe } from "../../../lib/stripe";
import { createSupabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ locals, request, redirect }) => {
  const user = locals.user;
  if (!user) return redirect("/login");

  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const customerId = profile?.stripe_customer_id as string | undefined;
  if (!customerId) {
    return new Response("No billing account found.", { status: 400 });
  }

  try {
    const origin = new URL(request.url).origin;
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard`,
    });
    return redirect(session.url);
  } catch (err) {
    console.error("[stripe/portal]", err);
    return new Response("Failed to open billing portal.", { status: 500 });
  }
};
