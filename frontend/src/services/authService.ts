import { supabase } from "../lib/supabase";
import { supabaseAdmin } from "../lib/supabaseAdmin";

interface RegisterDistributorInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}

export const registerDistributor = async (data: RegisterDistributorInput) => {
  // Buat akun Supabase Auth sebagai admin
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  });

  if (authError) {
    return { error: authError };
  }

  const authUser = authData.user;
  if (!authUser) {
    return { error: { message: "Gagal membuat akun auth distributor." } };
  }

  // Insert ke tabel users
  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .insert([
      {
        auth_user_id: authUser.id,
        name: data.name,
        email: data.email,
        role: "distributor",
        is_approved: true,
      },
    ])
    .select()
    .single();

  if (userError) {
    return { error: userError };
  }

  // Insert ke tabel distributors
  const { error: distributorError } = await supabaseAdmin.from("distributors").insert([
    {
      user_id: userData.id,
      distributor_name: data.name,
      phone: data.phone,
      address: data.address,
    },
  ]);

  if (distributorError) {
    return { error: distributorError };
  }

  return { data: { authUserId: authUser.id, userId: userData.id } };
};

export const loginUser = async (
  email: string,
  password: string
) => {

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    return { error };
  }

  return { data };
};

export const getCurrentUserRole = async () => {

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (error) {
    return null;
  }

  return data;
};
