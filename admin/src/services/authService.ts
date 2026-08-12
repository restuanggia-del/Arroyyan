import { supabase } from "../lib/supabase";

export interface CurrentUser {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: "admin" | "distributor" | "sales";
  is_approved: boolean;
  created_at: string;
}

export const loginUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { error };
  return { data };
};

export const getCurrentUserRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (error) return null;
  return data as CurrentUser;
};

export const assertAdminAccess = (userData: CurrentUser) => {
  if (userData.role === "sales") {
    return {
      allowed: false,
      message:
        "Akun sales tidak dapat masuk ke panel admin. Silakan gunakan aplikasi mobile Sales.",
    };
  }
  if (userData.role === "distributor") {
    return {
      allowed: false,
      message:
        "Akun distributor tidak dapat masuk ke panel admin. Silakan gunakan aplikasi mobile.",
    };
  }
  if (userData.role !== "admin") {
    return {
      allowed: false,
      message: "Akun Anda tidak memiliki akses ke panel admin ini.",
    };
  }
  return { allowed: true, message: null };
};

export const assertSalesAppAccess = (userData: CurrentUser) => {
  if (userData.role !== "sales") {
    return { allowed: false, message: "Akun ini bukan akun sales." };
  }
  if (!userData.is_approved) {
    return {
      allowed: false,
      message: "Akun belum disetujui admin. Hubungi administrator.",
    };
  }
  return { allowed: true, message: null };
};

export const logoutUser = async () => {
  await supabase.auth.signOut();
};
