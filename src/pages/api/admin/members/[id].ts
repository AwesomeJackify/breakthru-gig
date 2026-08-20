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
      await stripe.customers.del(profile.stripe_customer_id);
    }
  } catch (error) {
    // A previous deletion, or a customer created in the other Stripe mode,
    // leaves a stale ID in Supabase. It is safe to finish removing the member.
    if (error instanceof Stripe.errors.StripeError && error.code === "resource_missing") {
      console.warn("[admin/members/delete] Stripe customer was already missing", {
        userId,
        customerId: profile?.stripe_customer_id,
      });
    } else {
    console.error("[admin/members/delete] Stripe cleanup failed", error);
    return new Response(JSON.stringify({ error: "Stripe cleanup failed, so the member was not deleted." }), { status: 502 });
    }
  }

  // Delete dependent records before the profile to avoid a foreign-key race.
  for (const [table, column] of [["purchases", "user_id"], ["subscriptions", "user_id"], ["profiles", "id"]] as const) {
    const { error: cleanupError } = await admin.from(table).delete().eq(column, userId);
    if (cleanupError) {
      console.error("[admin/members/delete] Database cleanup failed", { table, error: cleanupError });
      return new Response(JSON.stringify({ error: `Could not remove the member's ${table} record. No account deletion was attempted.` }), { status: 500 });
    }
  }

  let deleteError: { message: string } | null;
  try {
    const result = await admin.auth.admin.deleteUser(target.id, false);
    deleteError = result.error;
  } catch (error) {
    console.error("[admin/members/delete] Auth cleanup request failed", error);
    return new Response(JSON.stringify({ error: "Supabase could not be reached to remove this account. Check the server configuration and try again." }), { status: 502 });
  }
  if (deleteError) {
    console.error("[admin/members/delete] Auth cleanup failed", deleteError);
    return new Response(JSON.stringify({ error: "The account could not be removed after billing was cancelled. Please contact support before retrying." }), { status: 500 });
  }

  return new Response(JSON.stringify({ deleted: true }), { headers: { "Content-Type": "application/json" } });
};
