import { supabase } from '@/integrations/supabase/client';

export async function sendSms(phone: string, message: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: { phone, message },
    });
    if (error) return { ok: false, error: error.message };
    const ok = !!(data?.ok ?? false);
    return { ok, error: ok ? undefined : String(data?.error || '') };
  } catch (e) {
    const msg = (e as Error)?.message ?? String(e ?? 'send failed');
    return { ok: false, error: msg };
  }
}
