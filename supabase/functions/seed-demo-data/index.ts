import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const demoUsers = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@minimind.agency',
        name: 'Admin User',
        role: 'admin',
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'moderator@minimind.agency',
        name: 'Moderator User',
        role: 'moderator',
      },
    ];

    for (const user of demoUsers) {
      const { error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'demo123',
        email_confirm: true,
        user_metadata: { name: user.name },
      });

      if (authError && !authError.message.includes('already')) {
        console.error('Auth error:', authError);
      }

      const { error: profileError } = await supabase
        .from('users')
        .upsert(user, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile error:', profileError);
      }
    }

    const mockPages = [
      {
        url: 'https://facebook.com/localcafe',
        page_id: 'fb_1001',
        name: 'Local Cafe',
        category: 'Restaurant',
        contact_email: 'info@localcafe.com',
        about: 'Cozy neighborhood cafe serving artisan coffee and pastries',
        cover_image_url: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg',
        profile_image_url: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg',
        created_by: demoUsers[0].id,
      },
      {
        url: 'https://facebook.com/fitnessstudio',
        page_id: 'fb_1002',
        name: 'Fitness Studio',
        category: 'Gym',
        contact_email: 'hello@fitnessstudio.com',
        about: 'Premium fitness center with personal training',
        cover_image_url: 'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg',
        profile_image_url: 'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg',
        created_by: demoUsers[1].id,
      },
    ];

    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .upsert(mockPages, { onConflict: 'url' })
      .select();

    if (pagesError) throw pagesError;

    if (pages) {
      for (const page of pages) {
        const analysisData = {
          page_id: page.id,
          overall_score: Math.floor(Math.random() * 40) + 40,
          issues: [
            { type: 'Low Resolution', severity: 'high', description: 'Images below optimal quality' },
            { type: 'Inconsistent Branding', severity: 'medium', description: 'Multiple font styles used' },
          ],
          suggestions: [
            { title: 'Improve Image Quality', description: 'Use high-resolution images', priority: 'high' },
            { title: 'Standardize Typography', description: 'Use consistent fonts', priority: 'medium' },
          ],
          images_analyzed: 8,
          need_decision: 'yes',
          confidence_score: 0.85,
          rationale: `${page.name} shows significant design inconsistencies affecting engagement`,
          analyzed_by: demoUsers[0].id,
        };

        const { data: analysis, error: analysisError } = await supabase
          .from('analyses')
          .insert(analysisData)
          .select()
          .single();

        if (analysisError) {
          console.error('Analysis error:', analysisError);
          continue;
        }

        const draftData = {
          page_id: page.id,
          analysis_id: analysis.id,
          fb_message: `Hi! I reviewed your page and noticed some design improvements that could boost engagement. Would you like a free concept?`,
          email_subject: `Design refresh proposal for ${page.name}`,
          email_body: `Hello,\n\nI reviewed your Facebook page and identified opportunities to improve visual branding and engagement through consistent design.\n\nI can provide a free concept for you to review.\n\nBest regards,\nMinimind Agency`,
          status: 'pending',
          created_by: demoUsers[0].id,
        };

        await supabase.from('drafts').insert(draftData);
      }
    }

    const campaignData = {
      name: 'Q4 2025 Outreach',
      description: 'End of year outreach campaign for local businesses',
      status: 'active',
      created_by: demoUsers[0].id,
      pages_count: 2,
      sent_count: 0,
      reply_count: 0,
    };

    await supabase.from('campaigns').upsert(campaignData, { onConflict: 'name' });

    return new Response(
      JSON.stringify({ success: true, message: 'Demo data seeded successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});