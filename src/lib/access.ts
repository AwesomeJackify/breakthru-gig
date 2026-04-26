import type { SupabaseClient } from "@supabase/supabase-js";

export interface UserEntitlements {
  hasSubscription: boolean;
  hasProgramme: boolean;
  hasMealPlan: boolean;
}

export async function getUserEntitlements(
  userId: string,
  supabase: SupabaseClient
): Promise<UserEntitlements> {
  const [subResult, purchaseResult] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .eq("status", "active")
      .gt("current_period_end", new Date().toISOString())
      .maybeSingle(),
    supabase
      .from("purchases")
      .select("product")
      .eq("user_id", userId),
  ]);

  const products: string[] = (purchaseResult.data ?? []).map((p: { product: string }) => p.product);

  const hasSubscription = !!subResult.data;
  return {
    hasSubscription,
    hasProgramme: hasSubscription || products.includes("12week_programme"),
    hasMealPlan: hasSubscription || products.includes("meal_plan_pdf"),
  };
}

export function canWatchVideo(
  entitlements: UserEntitlements,
  videoAccess: "subscription" | "programme_12week"
): boolean {
  if (videoAccess === "subscription") return entitlements.hasSubscription;
  if (videoAccess === "programme_12week") return entitlements.hasProgramme || entitlements.hasSubscription;
  return false;
}
