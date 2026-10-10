import AdminUserManagement from "@/components/AdminUserManagement";
import { getAdminUserOverview } from "@/utils/adminUsers";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);
  if (profile?.role !== "admin") redirect("/unauthorized");

  const users = await getAdminUserOverview(createAdminClient());
  return <AdminUserManagement initialUsers={users} />;
}
