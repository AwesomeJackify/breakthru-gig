import Stripe from "stripe";
import { createSupabaseAdmin } from "./supabase";

export const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  const existing = profile?.stripe_customer_id as string | undefined;
  if (existing) {
    try {
      const customer = await stripe.customers.retrieve(existing);
      if (!customer.deleted) return existing;
    } catch (error) {
      const code = error instanceof Stripe.errors.StripeError ? error.code : undefined;
      if (code !== "resource_missing") throw error;
    }
  }

  const customer = await stripe.customers.create({ email });
  await admin.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", userId);
  return customer.id;
}
