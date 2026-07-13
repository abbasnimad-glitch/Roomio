import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getCurrentUser(supabase: SupabaseServerClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export interface RoleGateResult {
  supabase: SupabaseServerClient;
  user: { id: string } | null;
  ok: boolean;
  message: string;
}

// Fetches the current session and checks it against a set of allowed roles.
// Shared by every server action that needs an admin/owner-style gate, so the
// auth.getUser() + profile-role lookup only lives in one place.
export async function requireRole(allowedRoles: UserRole[], deniedMessage: string): Promise<RoleGateResult> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { supabase, user: null, ok: false, message: "กรุณาเข้าสู่ระบบ" };

  const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!myProfile || !allowedRoles.includes(myProfile.role)) {
    return { supabase, user, ok: false, message: deniedMessage };
  }
  return { supabase, user, ok: true, message: "" };
}
