
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// This is the reverted "placeholder" version of the function.
// It generates predictable demo data and has no external dependencies.

console.log("`analyze-page` (placeholder version) function script started.");

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { page_id, user_id, page_name } = await req.json();

    if (!page_id || !user_id || !page_name) {
      throw new Error('page_id, user_id, and page_name are required');
    }

    // --- Placeholder Analysis Logic ---
    const overall_score = Math.floor(Math.random() * 50) + 40; // Score between 40 and 90
    const need_decision = overall_score < 65 ? 'yes' : (overall_score < 85 ? 'maybe' : 'no');
    const confidence_score = Math.random() * 0.3 + 0.7; // Confidence between 0.7 and 1.0

    const placeholder_issues = [
      { type: 'Branding', severity: 'Medium', description: 'Logo is not prominent enough or is used inconsistently across recent posts.' },
      { type: 'UX', severity: 'High', description: 'The primary Call-to-Action is not immediately clear to a new visitor.' },
      { type: 'Content Quality', severity: 'Low', description: 'Text in some posts contains minor spelling or grammatical errors.' },
      { type: 'Technical SEO', severity: 'Medium', description: 'Facebook Page meta tags (og:description) are missing or too short.' },
    ];

    const placeholder_suggestions = [
      { title: 'Brand Guideline Creation', description: 'We can establish a consistent brand guideline for your logo, colors, and typography.' },
      { title: 'High-Resolution Post Graphics', description: 'Our team will design professional, high-resolution graphics for your future posts.' },
      { title: 'Website Landing Page', description: 'A dedicated landing page can convert your Facebook visitors into customers more effectively.' },
    ];
    // --- End of Placeholder Logic ---

    const analysisResult = {
      page_id,
      overall_score,
      issues: placeholder_issues.slice(0, Math.floor(Math.random() * 2) + 2), // show 2-3 issues
      suggestions: placeholder_suggestions.slice(0, Math.floor(Math.random() * 2) + 1), // show 1-2 suggestions
      images_analyzed: 0,
      need_decision,
      confidence_score,
      rationale: `The AI decided '${need_decision}' because the overall design score of ${overall_score} indicates several areas for branding and UX improvement.`,
      analyzed_by: user_id,
    };

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    const { data, error } = await supabase.from('analyses').insert(analysisResult).select().single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
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
