import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "./lib/supabase";

const PROTECTED_PREFIXES = ["/videos", "/admin", "/downloads", "/dashboard"];
const ADMIN_PREFIXES = ["/admin"];

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseServerClient(context.cookies, context.request);
  context.locals.supabase = supabase;

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    context.locals.user = {
      id: user.id,
      email: user.email ?? "",
      is_admin: profile?.is_admin ?? false,
    };
  } else {
    context.locals.user = null;
  }

  const pathname = new URL(context.request.url).pathname;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAdmin = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !context.locals.user) {
    return context.redirect("/login");
  }

  if (isAdmin && !context.locals.user?.is_admin) {
    return context.redirect("/dashboard");
  }

  return next();
});
