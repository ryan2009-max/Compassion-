import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, MessageSquare, Send, Users, Phone, X, FileDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { sendSms } from '@/lib/sms';

type UntypedSelect = { order: (...args: unknown[]) => Promise<{ data: unknown }> };
type UntypedUpdate = { eq: (...args: unknown[]) => Promise<unknown> };
type UntypedQuery = {
  select: (...args: unknown[]) => UntypedSelect;
  insert: (...args: unknown[]) => Promise<unknown>;
  update: (...args: unknown[]) => UntypedUpdate;
};
type UntypedSupabase = { from: (table: string) => UntypedQuery };
const sb = supabase as unknown as UntypedSupabase;

type Caregiver = {
  id: string;
  name: string;
  child_number: string;
  phone_number: string;
  is_active: boolean;
};

type SmsLog = {
  caregiver_id: string;
  message: string;
  status: 'sent' | 'failed';
  sent_at: string;
};

type Template = {
  id: string;
  name: string;
  text: string;
};

const mockCaregivers: Caregiver[] = [
  { id: 'cg-1', name: 'Grace Auma', child_number: 'CS001', phone_number: '+254712345678', is_active: true },
  { id: 'cg-2', name: 'Peter Okoth', child_number: 'CS002', phone_number: '0712345678', is_active: true },
  { id: 'cg-3', name: 'Mary Wanjiru', child_number: 'CS003', phone_number: '', is_active: true },
  { id: 'cg-4', name: 'John Doe', child_number: 'CS004', phone_number: '+254700000000', is_active: false },
  { id: 'cg-5', name: 'Jane Roe', child_number: 'CS005', phone_number: '+254798123456', is_active: true },
];

function isValidPhone(phone: string) {
  if (!phone) return false;
  const normalized = phone.replace(/\s+/g, '');
  if (/^\+?\d{10,15}$/.test(normalized)) return true;
  if (/^0\d{9}$/.test(normalized)) return true;
  return false;
}

function normalizePhone(phone: string) {
  const n = phone.replace(/\s+/g, '');
  if (/^\+\d{10,15}$/.test(n)) return n;
  if (/^0\d{9}$/.test(n)) return `+254${n.slice(1)}`;
  return null;
}

function toCSV(logs: SmsLog[]) {
  const header = ['caregiver_id', 'message', 'status', 'sent_at'];
  const rows = logs.map(l => [l.caregiver_id, JSON.stringify(l.message), l.status, l.sent_at]);
  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

export default function CaregiverMessaging() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [message, setMessage] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [showCaregiverModal, setShowCaregiverModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showAddPhoneModal, setShowAddPhoneModal] = useState(false);
  const [selectedCaregiverId, setSelectedCaregiverId] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ total: 0, done: 0 });
  const [logs, setLogs] = useState<SmsLog[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await sb
          .from('caregivers')
          .select('*')
          .order('created_at', { ascending: false });
        if (Array.isArray(data) && data.length) {
          type CaregiverRow = { id: string; name: string; child_number: string; phone_number?: string | null; is_active?: boolean | null };
          const rows = (data as unknown[]) as CaregiverRow[];
          setCaregivers(
            rows.map((d) => ({
              id: String(d.id),
              name: String(d.name),
              child_number: String(d.child_number),
              phone_number: String(d.phone_number ?? ''),
              is_active: Boolean(d.is_active ?? true),
            }))
          );
        } else {
          setCaregivers(mockCaregivers);
        }
      } catch (e) {
        setCaregivers(mockCaregivers);
      }
    };
    load();

    const stored = localStorage.getItem('smsTemplates');
    if (stored) {
      setTemplates(JSON.parse(stored));
    } else {
      const initial: Template[] = [
        { id: 'tpl-1', name: 'Meeting Reminder', text: 'Reminder: Caregiver meeting tomorrow at 10:00 AM at the CDC hub.' },
        { id: 'tpl-2', name: 'Urgent Notice', text: 'Urgent: Please contact the CDC office regarding your child’s program update.' },
        { id: 'tpl-3', name: 'General Update', text: 'Hello, we have posted new information regarding your child’s progress. Thank you.' },
      ];
      setTemplates(initial);
      localStorage.setItem('smsTemplates', JSON.stringify(initial));
    }
  }, []);

  const stats = useMemo(() => {
    const total = caregivers.length;
    const valid = caregivers.filter(c => isValidPhone(c.phone_number)).length;
    const inactive = caregivers.filter(c => !c.is_active).length;
    return { total, valid, inactive };
  }, [caregivers]);

  const validTargets = useMemo(() => {
    return caregivers.filter(c => c.is_active && isValidPhone(c.phone_number));
  }, [caregivers]);

  const caregiversMissingPhone = useMemo(() => {
    return caregivers.filter(c => !isValidPhone(c.phone_number));
  }, [caregivers]);

  const remainingChars = 500 - message.length;

  const applyTemplate = (id: string) => {
    setSelectedTemplate(id);
    const tpl = templates.find(t => t.id === id);
    if (tpl) setMessage(tpl.text);
  };

  const saveTemplate = () => {
    if (!newTemplateName.trim() || !message.trim()) {
      toast({ title: 'Missing information', description: 'Enter a template name and message text.', variant: 'destructive' });
      return;
    }
    const t: Template = { id: `tpl-${Date.now()}`, name: newTemplateName.trim(), text: message };
    const next = [t, ...templates];
    setTemplates(next);
    localStorage.setItem('smsTemplates', JSON.stringify(next));
    setNewTemplateName('');
    setShowSaveTemplateModal(false);
    toast({ title: 'Template saved', description: 'Message template added.' });
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast({ title: 'Message required', description: 'Write a message before sending.', variant: 'destructive' });
      return;
    }
    if (message.length > 500) {
      toast({ title: 'Too long', description: 'Message must be 500 characters or fewer.', variant: 'destructive' });
      return;
    }
    if (validTargets.length === 0) {
      toast({ title: 'No recipients', description: 'No active caregivers with valid phone numbers.', variant: 'destructive' });
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSend = async () => {
    setShowConfirmModal(false);
    setSending(true);
    setProgress({ total: validTargets.length, done: 0 });
    setLogs([]);
    toast({ title: 'Sending', description: `Sending message to ${validTargets.length} caregivers...` });

    for (let i = 0; i < validTargets.length; i++) {
      const cg = validTargets[i];
      await new Promise(r => setTimeout(r, 80));
      const normalized = normalizePhone(cg.phone_number);
      let ok = !!normalized;
      if (ok && normalized) {
        const result = await sendSms(normalized, message);
        ok = result.ok;
      }
      const entry: SmsLog = {
        caregiver_id: cg.id,
        message,
        status: ok ? 'sent' : 'failed',
        sent_at: new Date().toISOString(),
      };
      setLogs(prev => [...prev, entry]);
      try {
        await sb
          .from('sms_logs')
          .insert({
            caregiver_id: cg.id,
            message,
            status: ok ? 'sent' : 'failed',
            sent_at: new Date().toISOString(),
          });
      } catch (e) {
        console.error('SMS log insert failed', e);
      }
      setProgress(prev => ({ ...prev, done: prev.done + 1 }));
    }

    setSending(false);
    const sent = logs.filter(l => l.status === 'sent').length;
    const failed = logs.filter(l => l.status === 'failed').length;
    toast({ title: 'Completed', description: `Sent: ${sent} • Failed: ${failed}` });
  };

  const downloadCSV = () => {
    const blob = toCSV(logs);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sms_logs_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">Caregiver SMS</h1>
                <p className="text-sm text-muted-foreground">Bulk messaging for caregiver communication</p>
              </div>
            </div>
            <FuturisticButton variant="outline" onClick={() => navigate('/admin/dashboard')}>Back</FuturisticButton>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="card-futuristic lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Message Composer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Templates</label>
                  <Select value={selectedTemplate} onValueChange={applyTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <FuturisticButton variant="outline" className="w-full" onClick={() => setShowSaveTemplateModal(true)}>Save Current as Template</FuturisticButton>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Message (max 500)</label>
                <Textarea
                  value={message}
                  onChange={(e) => { if (e.target.value.length <= 500) setMessage(e.target.value); }}
                  placeholder="Write your message to caregivers"
                  className="min-h-[140px]"
                  disabled={sending}
                />
                <div className="text-right text-xs text-muted-foreground">{remainingChars} characters left</div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Caregiver Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total caregivers</span>
                <Badge variant="outline">{stats.total}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Valid phone numbers</span>
                <Badge variant="outline" className="flex items-center gap-1"><Phone className="w-3 h-3" />{stats.valid}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Inactive caregivers</span>
                <Badge variant="outline" className="status-disabled">{stats.inactive}</Badge>
              </div>
              <FuturisticButton variant="outline" className="w-full" onClick={() => setShowCaregiverModal(true)}>View Caregiver List</FuturisticButton>
              <FuturisticButton variant="outline" className="w-full" onClick={() => {
                if (caregiversMissingPhone.length > 0) {
                  setSelectedCaregiverId(caregiversMissingPhone[0].id);
                } else if (caregivers.length > 0) {
                  setSelectedCaregiverId(caregivers[0].id);
                } else {
                  setSelectedCaregiverId('');
                }
                setNewPhone('');
                setShowAddPhoneModal(true);
              }}>Add Caregiver Phone</FuturisticButton>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="card-futuristic lg:col-span-2">
            <CardHeader>
              <CardTitle>Message Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mx-auto max-w-sm border rounded-2xl p-4 bg-muted/30">
                <div className="rounded-xl bg-background border p-4 min-h-[160px]">
                  <p className="text-sm whitespace-pre-wrap break-words">{message || 'Your message preview will appear here'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FuturisticButton
                variant="futuristic"
                className="w-full gap-2"
                onClick={handleSend}
                disabled={sending}
              >
                <Send className="w-4 h-4" /> Send to All Caregivers
              </FuturisticButton>
              <FuturisticButton variant="outline" className="w-full" onClick={() => setMessage('')} disabled={sending}>Clear</FuturisticButton>
              <FuturisticButton variant="destructive" className="w-full" onClick={() => navigate('/admin/dashboard')} disabled={sending}>Cancel</FuturisticButton>
              {sending && (
                <div className="text-xs text-muted-foreground">Sending message to {progress.total} caregivers… {progress.done}/{progress.total}</div>
              )}
              {!sending && logs.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm">Summary</div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Sent</span>
                    <Badge variant="outline">{logs.filter(l => l.status === 'sent').length}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Failed</span>
                    <Badge variant="destructive">{logs.filter(l => l.status === 'failed').length}</Badge>
                  </div>
                  <FuturisticButton variant="outline" className="w-full gap-2" onClick={downloadCSV}><FileDown className="w-4 h-4" /> Download CSV Report</FuturisticButton>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showCaregiverModal} onOpenChange={setShowCaregiverModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Caregiver List</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[50vh] overflow-auto">
            {caregivers.map(c => (
              <div key={c.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-muted-foreground">#{c.child_number}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={c.is_active ? 'status-active' : 'status-disabled'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
                  <Badge variant="outline" className={isValidPhone(c.phone_number) ? '' : 'status-disabled'}>{c.phone_number || 'No phone'}</Badge>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveTemplateModal} onOpenChange={setShowSaveTemplateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Template name" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} />
            <div className="flex gap-2">
              <FuturisticButton className="flex-1" variant="outline" onClick={() => setShowSaveTemplateModal(false)}><X className="w-4 h-4 mr-1" /> Cancel</FuturisticButton>
              <FuturisticButton className="flex-1" variant="futuristic" onClick={saveTemplate}>Save</FuturisticButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Send</DialogTitle>
          </DialogHeader>
          <p className="text-sm">Are you sure you want to send this message to all caregivers?</p>
          <div className="flex gap-2 mt-3">
            <FuturisticButton className="flex-1" variant="outline" onClick={() => setShowConfirmModal(false)}><X className="w-4 h-4 mr-1" /> Cancel</FuturisticButton>
            <FuturisticButton className="flex-1" variant="futuristic" onClick={confirmSend} disabled={sending}><Send className="w-4 h-4 mr-1" /> Send</FuturisticButton>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddPhoneModal} onOpenChange={setShowAddPhoneModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Caregiver Phone</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Caregiver</label>
            <Select value={selectedCaregiverId} onValueChange={setSelectedCaregiverId}>
              <SelectTrigger>
                <SelectValue placeholder="Select caregiver" />
              </SelectTrigger>
              <SelectContent>
                {caregivers.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name} • #{c.child_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
            <Input placeholder="Enter phone number" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
            <div className="flex gap-2">
              <FuturisticButton className="flex-1" variant="outline" onClick={() => setShowAddPhoneModal(false)}><X className="w-4 h-4 mr-1" /> Cancel</FuturisticButton>
              <FuturisticButton className="flex-1" variant="futuristic" onClick={() => {
                const p = newPhone.trim();
                if (!selectedCaregiverId || !p) {
                  toast({ title: 'Missing information', description: 'Select a caregiver and enter a phone number.', variant: 'destructive' });
                  return;
                }
                if (!isValidPhone(p)) {
                  toast({ title: 'Invalid phone', description: 'Enter a valid phone number format.', variant: 'destructive' });
                  return;
                }
                setCaregivers(prev => prev.map(c => c.id === selectedCaregiverId ? { ...c, phone_number: p } : c));
                (async () => {
                  try {
                    await sb
                      .from('caregivers')
                      .update({ phone_number: p })
                      .eq('id', selectedCaregiverId);
                  } catch (e) {
                    console.error('Caregiver phone update failed', e);
                  }
                })();
                setShowAddPhoneModal(false);
                setSelectedCaregiverId('');
                setNewPhone('');
                toast({ title: 'Phone updated', description: 'Caregiver phone number saved.' });
              }}>Save</FuturisticButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
