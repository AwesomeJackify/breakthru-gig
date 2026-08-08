import type { APIRoute } from "astro";
import { stripe, getOrCreateStripeCustomer } from "../../../lib/stripe";

const PROGRAMME_AGE_CONFIRMATION = {
  key: "programme_age_confirmation",
  label: { type: "custom" as const, custom: "Programme eligibility" },
  type: "dropdown" as const,
  dropdown: {
    options: [{ label: "I confirm I am aged 16 or older", value: "aged_16_or_over" }],
  },
  optional: false,
};

export const POST: APIRoute = async ({ locals, request, redirect }) => {
  const user = locals.user;
  if (!user) return redirect("/login");

  try {
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);
    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: import.meta.env.STRIPE_PRICE_SUBSCRIPTION, quantity: 1 }],
      custom_fields: [PROGRAMME_AGE_CONFIRMATION],
      custom_text: {
        submit: {
          message:
            "Your membership includes a tailored programme, available to people aged 16 and over only.",
        },
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscribe`,
      subscription_data: { metadata: { user_id: user.id } },
    });
    return redirect(session.url!);
  } catch (err) {
    console.error("[checkout/subscription]", err);
    return new Response("Failed to create checkout session.", { status: 500 });
  }
};
