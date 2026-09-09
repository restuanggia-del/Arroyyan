import { supabase } from "../lib/supabase";
import { supabaseAdmin } from "../lib/supabaseAdmin";

export interface CurrentUser {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: "admin" | "admin_gudang" | "admin_produk" | "distributor" | "sales";
  is_approved: boolean;
  created_at: string;
}

const PANEL_ROLES = ["admin", "admin_gudang", "admin_produk"] as const;
export type PanelRegisterRole = (typeof PANEL_ROLES)[number];

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
  if (!PANEL_ROLES.includes(userData.role as (typeof PANEL_ROLES)[number])) {
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

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: PanelRegisterRole;
}

export const registerUser = async (input: RegisterInput) => {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name) return { error: { message: "Nama wajib diisi." } };
  if (!email) return { error: { message: "Email wajib diisi." } };
  if (input.password.length < 6) {
    return { error: { message: "Password minimal 6 karakter." } };
  }
  if (!PANEL_ROLES.includes(input.role)) {
    return { error: { message: "Role tidak valid." } };
  }

  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingUser) {
    return { error: { message: "Email ini sudah terdaftar. Silakan login." } };
  }

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
    });

  if (authError || !authData.user) {
    return {
      error: authError ?? { message: "Gagal membuat akun. Coba lagi." },
    };
  }

  const { data: userRow, error: userError } = await supabaseAdmin
    .from("users")
    .insert([
      {
        auth_user_id: authData.user.id,
        name,
        email,
        role: input.role,
        is_approved: true,
      },
    ])
    .select()
    .single();

  if (userError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return { error: userError };
  }

  await supabaseAdmin.from("activity_logs").insert([
    {
      activity_type: "register_admin",
      description: `Akun panel admin baru terdaftar: ${name} (${email}) sebagai ${input.role}`,
      user_id: userRow.id,
    },
  ]);

  return { data: userRow as CurrentUser, error: null };
};
