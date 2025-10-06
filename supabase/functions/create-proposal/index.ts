import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// This is a placeholder/demo version of the create-proposal function.
// It does NOT call an AI. It uses the data from the demo analysis to create a simple proposal.
// This ensures the UI workflow is functional without depending on external, failing services.

console.log("`create-proposal` (placeholder version) function script started.");

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { analysis_id, user_id } = await req.json();
    if (!analysis_id || !user_id) {
      throw new Error('analysis_id and user_id are required.');
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    // 1. Fetch the analysis and page data
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*, pages(*)')
      .eq('id', analysis_id)
      .single();

    if (analysisError) throw new Error(`Failed to fetch analysis: ${analysisError.message}`);
    if (!analysis) throw new Error('Analysis not found.');
    if (!analysis.pages) throw new Error('Page data not found for the analysis.');

    const pageData = analysis.pages;

    // 2. Generate a placeholder proposal based on the analysis data
    const firstIssue = analysis.issues?.[0]?.description || 'design inconsistencies';
    const proposalText = `Hi ${pageData.name}, I checked your Facebook page and noticed some issues regarding ${firstIssue}. I can share one free concept for you to review — no obligations. Interested?`;
    const subject = `A design idea for ${pageData.name}`;

    // 3. Save the new draft to the database
    const draftToInsert = {
      page_id: pageData.id,
      analysis_id: analysis.id,
      fb_message: proposalText,
      email_subject: subject,
      email_body: `${proposalText}<br><br>Best,<br>The Minimind Agency Team`,
      status: 'pending',
      created_by: user_id,
      version: 1,
    };

    const { data: newDraft, error: draftError } = await supabase
      .from('drafts')
      .insert(draftToInsert)
      .select()
      .single();

    if (draftError) throw new Error(`Failed to save draft: ${draftError.message}`);

    console.log("Successfully created and saved a new placeholder draft.");
    return new Response(JSON.stringify(newDraft), {
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