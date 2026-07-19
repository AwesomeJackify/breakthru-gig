import type { APIRoute } from "astro";
import { stripe } from "../../../../lib/stripe";
import { createSupabaseAdmin } from "../../../../lib/supabase";

export const DELETE: APIRoute = async ({ locals, params }) => {
  if (!locals.user?.is_admin) return new Response(JSON.stringify({ error: "Unauthorised." }), { status: 403 });

  const userId = params.id;
  if (!userId) return new Response(JSON.stringify({ error: "Missing member ID." }), { status: 400 });
  if (userId === locals.user.id) return new Response(JSON.stringify({ error: "You cannot delete your own admin account." }), { status: 400 });

  const admin = createSupabaseAdmin();
  const { data: targetResult, error: targetError } = await admin.auth.admin.getUserById(userId);
  const target = targetResult.user;
  if (targetError || !target) return new Response(JSON.stringify({ error: "Member not found." }), { status: 404 });

  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.is_admin) return new Response(JSON.stringify({ error: "Admin accounts are protected from deletion." }), { status: 400 });

  try {
    if (profile?.stripe_customer_id) {
      const stripeSubscriptions = await stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: "all", limit: 100 });
      await Promise.all(stripeSubscriptions.data
        .filter((subscription) => !["canceled", "incomplete_expired"].includes(subscription.status))
        .map((subscription) => stripe.subscriptions.cancel(subscription.id)));
      await stripe.customers.del(profile.stripe_customer_id);
    }
  } catch (error) {
    console.error("[admin/members/delete] Stripe cleanup failed", error);
    return new Response(JSON.stringify({ error: "Stripe cleanup failed, so the member was not deleted." }), { status: 502 });
  }

  const cleanup = await Promise.all([
    admin.from("purchases").delete().eq("user_id", userId),
    admin.from("subscriptions").delete().eq("user_id", userId),
    admin.from("profiles").delete().eq("id", userId),
  ]);
  const cleanupError = cleanup.find((result) => result.error)?.error;
  if (cleanupError) {
    console.error("[admin/members/delete] Database cleanup failed", cleanupError);
    return new Response(JSON.stringify({ error: "Database cleanup failed after billing was cancelled. Please contact support before retrying." }), { status: 500 });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(target.id, false);
  if (deleteError) {
    console.error("[admin/members/delete] Auth cleanup failed", deleteError);
    return new Response(JSON.stringify({ error: "The account could not be removed after billing was cancelled. Please contact support before retrying." }), { status: 500 });
  }

  return new Response(JSON.stringify({ deleted: true }), { headers: { "Content-Type": "application/json" } });
};
