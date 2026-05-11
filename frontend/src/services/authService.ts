import { supabase } from "../lib/supabase";

export const registerDistributor = async (
    name: string,
    email: string,
    password: string
) => {

    // REGISTER KE AUTH
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        return { error };
    }

    // INSERT KE TABLE USERS
    const userInsert = await supabase
        .from("users")
        .insert([
            {
                auth_user_id: data.user?.id,
                name,
                email,
                role: "distributor",
                is_approved: false,
            },
        ]);

    return userInsert;
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
