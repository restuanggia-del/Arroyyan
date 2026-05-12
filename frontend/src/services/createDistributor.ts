import { supabaseAdmin } from '../lib/supabaseAdmin';

interface CreateDistributorInput {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
}

export async function createDistributor(
    input: CreateDistributorInput
) {
    const { name, email, password, phone, address } = input;

    const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

    if (existingUser) {
        throw new Error('Email sudah terdaftar. Gunakan email lain.');
    }

    const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

    if (authError) {
        throw new Error(authError.message);
    }

    const authUser = authData.user;

    const { data: userProfile, error: userError } =
        await supabaseAdmin
            .from('users')
            .insert({
                auth_user_id: authUser.id,
                name,
                email,
                role: 'distributor',
                is_approved: true,
            })
            .select()
            .single();

    if (userError) {
        throw new Error(userError.message);
    }

    const { error: distributorError } =
        await supabaseAdmin
            .from('distributors')
            .insert({
                user_id: userProfile.id,
                distributor_name: name,
                phone,
                address,
            });

    if (distributorError) {
        throw new Error(distributorError.message);
    }

    return {
        success: true,
        message: 'Distributor berhasil dibuat.',
        auth_user_id: authUser.id,
        user_id: userProfile.id,
    };
}
