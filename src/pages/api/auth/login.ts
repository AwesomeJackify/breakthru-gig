import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ locals, request, redirect }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const requestedNext = formData.get("next")?.toString() ?? "/dashboard";
  const next = requestedNext.startsWith("/") ? requestedNext : "/dashboard";

  if (!email || !password) return redirect(`/login?error=Email+and+password+are+required&next=${encodeURIComponent(next)}`);

  const { error } = await locals.supabase.auth.signInWithPassword({ email, password });
  if (error) return redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  return redirect(next);
};
