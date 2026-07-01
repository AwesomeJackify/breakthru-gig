import type { APIRoute } from "astro";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Email-confirmation landing route.
 *
 * The signup confirmation link sends the user here with a one-time code (or
 * token_hash). We exchange it for a real session — which writes the auth
 * cookies via the middleware's Supabase client — so the user arrives at the
 * dashboard already logged in.
 *
 * Handles both Supabase email-link styles:
 *   - PKCE flow (default for @supabase/ssr): ?code=...
 *   - OTP  flow (custom email template):     ?token_hash=...&type=signup
 */
export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const supabase = locals.supabase;
  const next = url.searchParams.get("next") ?? "/dashboard";
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return redirect(`/login?error=${encodeURIComponent(error.message)}`);
    return redirect(next);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return redirect(`/login?error=${encodeURIComponent(error.message)}`);
    return redirect(next);
  }

  return redirect("/login?error=Missing+confirmation+code");
};
