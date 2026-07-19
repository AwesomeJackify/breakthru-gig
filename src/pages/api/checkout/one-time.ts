import type { APIRoute } from "astro";
import { stripe, getOrCreateStripeCustomer } from "../../../lib/stripe";
import { getUserEntitlements } from "../../../lib/access";

const PRODUCT_PRICES: Record<string, string> = {
  "12week_programme": import.meta.env.STRIPE_PRICE_12WEEK,
  "meal_plan_pdf": import.meta.env.STRIPE_PRICE_MEAL_PLAN,
};

export const POST: APIRoute = async ({ locals, request, redirect }) => {
  const user = locals.user;

  const formData = await request.formData();
  const product = formData.get("product") as string;
  const priceId = PRODUCT_PRICES[product];
  if (!priceId) return new Response("Invalid product.", { status: 400 });

  try {
    if (!user) return redirect("/login?signup=1&next=/dashboard/checkout/12-week");

    const entitlements = await getUserEntitlements(user.id, locals.supabase);
    if (product === "12week_programme" && entitlements.hasProgramme) {
      return redirect("/dashboard?notice=programme-owned");
    }
    if (product === "meal_plan_pdf" && entitlements.hasMealPlan) {
      return redirect("/dashboard?notice=meal-plan-owned");
    }

    const origin = new URL(request.url).origin;
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: product === "12week_programme"
        ? `${origin}/programmes/12-week/onboarding?session_id={CHECKOUT_SESSION_ID}`
        : `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: product === "12week_programme"
        ? `${origin}/dashboard/checkout/12-week`
        : product === "meal_plan_pdf"
          ? `${origin}/dashboard/checkout/meal-plan`
          : `${origin}/subscribe`,
      metadata: { product },
      payment_intent_data: { metadata: { user_id: user.id, product } },
    });
    return redirect(session.url!);
  } catch (err) {
    console.error("[checkout/one-time]", err);
    return new Response("Failed to create checkout session.", { status: 500 });
  }
};
