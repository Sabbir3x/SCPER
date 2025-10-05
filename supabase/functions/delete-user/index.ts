import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log("`delete-user` function script started.");

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the user that called the function.
    // This is used to verify that the caller is an admin.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { data: adminProfile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (adminProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Not authorized. Only admins can delete users.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // If the caller is an admin, proceed with deleting the target user.
    const { user_id_to_delete } = await req.json();
    if (!user_id_to_delete) {
      throw new Error('user_id_to_delete is required.');
    }

    // Create a Supabase client with the service role key to perform admin actions.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // First, delete the user's profile from the public.users table.
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', user_id_to_delete);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
      // We can still proceed to delete the auth user, but we should log this.
    }

    // Second, delete the user from auth.users.
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id_to_delete);

    if (authError) {
      throw new Error(`Failed to delete auth user: ${authError.message}`);
    }

    return new Response(JSON.stringify({ message: `User ${user_id_to_delete} deleted successfully.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});