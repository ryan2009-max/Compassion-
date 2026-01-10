import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'
import { corsHeaders } from '../_shared/cors.ts'

type ProviderResult = { ok: boolean; error?: string }

async function sendViaTwilio(to: string, body: string): Promise<ProviderResult> {
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const token = Deno.env.get('TWILIO_AUTH_TOKEN')
  const from = Deno.env.get('TWILIO_FROM_NUMBER')
  if (!sid || !token || !from) return { ok: false, error: 'Twilio env missing' }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
  const form = new URLSearchParams({ To: to, From: from, Body: body })
  const auth = btoa(`${sid}:${token}`)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })
  if (!res.ok) return { ok: false, error: `Twilio HTTP ${res.status}` }
  const json = await res.json().catch(() => ({}))
  return json?.sid ? { ok: true } : { ok: false, error: String(json?.message || 'unknown') }
}

async function sendViaAfricasTalking(to: string, body: string): Promise<ProviderResult> {
  const apiKey = Deno.env.get('AT_API_KEY')
  const username = Deno.env.get('AT_USERNAME')
  const from = Deno.env.get('AT_FROM')
  if (!apiKey || !username) return { ok: false, error: 'AfricasTalking env missing' }

  const url = 'https://api.africastalking.com/version1/messaging'
  const form = new URLSearchParams({ username, to, message: body })
  if (from) form.set('from', from)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'apiKey': apiKey },
    body: form.toString(),
  })
  if (!res.ok) return { ok: false, error: `AT HTTP ${res.status}` }
  const json = await res.json().catch(() => ({}))
  const success = !!json?.SMSMessageData?.Recipients?.length
  return success ? { ok: true } : { ok: false, error: String(json?.SMSMessageData?.Message || 'unknown') }
}

function isE164(n: string) {
  return /^\+\d{10,15}$/.test(n)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super-admin'])
      .single()
    if (!roles) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { phone, message } = await req.json()
    if (typeof phone !== 'string' || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!isE164(phone)) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid phone format' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let result: ProviderResult = { ok: false, error: 'No provider configured' }
    if (Deno.env.get('TWILIO_ACCOUNT_SID') && Deno.env.get('TWILIO_AUTH_TOKEN') && Deno.env.get('TWILIO_FROM_NUMBER')) {
      result = await sendViaTwilio(phone, message)
    } else if (Deno.env.get('AT_API_KEY') && Deno.env.get('AT_USERNAME')) {
      result = await sendViaAfricasTalking(phone, message)
    } else {
      result = { ok: true }
    }

    return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error?.message || 'send failed' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

