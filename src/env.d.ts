/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly STRIPE_SECRET_KEY: string;
  readonly STRIPE_PUBLISHABLE_KEY: string;
  readonly STRIPE_WEBHOOK_SECRET: string;
  readonly STRIPE_PRICE_SUBSCRIPTION: string;
  readonly STRIPE_PRICE_12WEEK: string;
  readonly STRIPE_PRICE_MEAL_PLAN: string;
  readonly MUX_TOKEN_ID: string;
  readonly MUX_TOKEN_SECRET: string;
  readonly MUX_WEBHOOK_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    supabase: import("@supabase/supabase-js").SupabaseClient;
    user: {
      id: string;
      email: string;
      is_admin: boolean;
    } | null;
  }
}
