import type { APIRoute } from "astro";
import Stripe from "stripe";
import { stripe } from "../../../lib/stripe";
import { createSupabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      import.meta.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return new Response("Webhook verification failed", { status: 400 });
  }

  const admin = createSupabaseAdmin();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.subscription
        ? ((await stripe.subscriptions.retrieve(session.subscription as string)).metadata.user_id)
        : session.payment_intent
          ? ((await stripe.paymentIntents.retrieve(session.payment_intent as string)).metadata.user_id)
          : null;

      if (!userId) break;

      if (session.mode === "subscription") {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await admin.from("subscriptions").upsert({
          user_id: userId,
          stripe_subscription_id: sub.id,
          status: sub.status,
          price_id: sub.items.data[0].price.id,
          current_period_end: new Date(sub.items.data[0].current_period_end * 1000).toISOString(),
        }, { onConflict: "stripe_subscription_id" });
      } else if (session.mode === "payment") {
        const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string);
        const product = pi.metadata.product;
        if (product) {
          await admin.from("purchases").insert({
            user_id: userId,
            product,
            stripe_payment_intent_id: pi.id,
          });
        }
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await admin.from("subscriptions")
        .update({
          status: sub.status,
          current_period_end: new Date(sub.items.data[0].current_period_end * 1000).toISOString(),
        })
        .eq("stripe_subscription_id", sub.id);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await admin.from("subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_subscription_id", sub.id);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        await admin.from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_subscription_id", invoice.subscription as string);
      }
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
