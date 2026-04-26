import type { APIRoute } from "astro";
import { stripe, getOrCreateStripeCustomer } from "../../../lib/stripe";

const PRODUCT_PRICES: Record<string, string> = {
  "12week_programme": import.meta.env.STRIPE_PRICE_12WEEK,
  "meal_plan_pdf": import.meta.env.STRIPE_PRICE_MEAL_PLAN,
};

export const POST: APIRoute = async ({ locals, request, redirect }) => {
  const user = locals.user;
  if (!user) return redirect("/login");

  const formData = await request.formData();
  const product = formData.get("product") as string;
  const priceId = PRODUCT_PRICES[product];
  if (!priceId) return new Response("Invalid product.", { status: 400 });

  try {
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);
    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscribe`,
      payment_intent_data: { metadata: { user_id: user.id, product } },
    });
    return redirect(session.url!);
  } catch (err) {
    console.error("[checkout/one-time]", err);
    return new Response("Failed to create checkout session.", { status: 500 });
  }
};
