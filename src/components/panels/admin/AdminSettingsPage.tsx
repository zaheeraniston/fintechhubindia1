'use client';

import { useEffect, useState, useRef } from 'react';
import { apiFetch, apiUpload } from '@/lib/api';
import { useSettingsStore } from '@/stores/settings-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Settings as SettingsIcon,
  Save,
  Upload,
  KeyRound,
  RefreshCw,
  Shield,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Daily access code state
  const [newCode, setNewCode] = useState('');
  const [savingCode, setSavingCode] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      const data = await apiFetch('/settings');
      if (data.map) {
        setSettings(data.map);
        setNewCode(data.map.dailyAccessCode || '');
      }
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  }

  async function handleSave(key: string, value: string) {
    setSavingKey(key);
    try {
      await apiFetch('/settings', { method: 'POST', body: JSON.stringify({ key, value }) });
      toast.success(`${key} updated`);
      setSettings({ ...settings, [key]: value });
      useSettingsStore.getState().updateSetting(key as any, value);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSavingKey(null); }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Founder photo must be under 2MB'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return; }
    try {
      const fd = new FormData();
      fd.append('file', file);
      const data = await apiUpload('/upload/founder', fd);
      setSettings({ ...settings, founderPhoto: data.url });
      useSettingsStore.getState().updateSetting('founderPhoto', data.url);
      toast.success('Founder photo updated');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Upload failed'); }
  }

  // Generate a random 6-digit code
  function generateCode() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setNewCode(code);
  }

  async function saveDailyCode() {
    if (!newCode || newCode.length !== 6 || !/^\d{6}$/.test(newCode)) {
      toast.error('Process ID must be exactly 6 digits (numbers only)');
      return;
    }
    setSavingCode(true);
    try {
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in IST-friendly format
      await Promise.all([
        apiFetch('/settings', { method: 'POST', body: JSON.stringify({ key: 'dailyAccessCode', value: newCode }) }),
        apiFetch('/settings', { method: 'POST', body: JSON.stringify({ key: 'dailyAccessCodeDate', value: today }) }),
      ]);
      setSettings({ ...settings, dailyAccessCode: newCode, dailyAccessCodeDate: today });
      toast.success(`✅ Today's Process ID set to ${newCode}`);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSavingCode(false); }
  }

  async function toggleCodeEnabled() {
    const current = settings.dailyAccessCodeEnabled === 'true';
    const newVal = current ? 'false' : 'true';
    await handleSave('dailyAccessCodeEnabled', newVal);
    setSettings({ ...settings, dailyAccessCodeEnabled: newVal });
  }

  function copyCode() {
    navigator.clipboard.writeText(settings.dailyAccessCode || '');
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  const codeEnabled = settings.dailyAccessCodeEnabled !== 'false';
  const codeDate = settings.dailyAccessCodeDate || '—';
  const storedCode = settings.dailyAccessCode || '000000';
  const isDefaultCode = storedCode === '000000' || storedCode === '';

  const settingFields = [
    { key: 'founderName', label: 'Founder Name', type: 'text' },
    { key: 'customerCareLink', label: 'Customer Care Link (WhatsApp)', type: 'text' },
    { key: 'whatsappLink', label: 'WhatsApp Redirect Link', type: 'text' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto relative z-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center shadow-lg">
            <SettingsIcon className="w-4 h-4 text-white" />
          </span>
          Global Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">Manage settings that sync across the entire app</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse border border-white/5" />)}
        </div>
      ) : (
        <>
          {/* ━━━━━ GET PROCESS ID SETTINGS ━━━━━ */}
          <Card className="border border-violet-500/30 shadow-2xl bg-violet-950/20 backdrop-blur-xl rounded-2xl overflow-hidden">
            <div className="h-0.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500" />
            <CardContent className="p-5 sm:p-6 space-y-5">
              {/* Title row */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                    <KeyRound className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-black text-white text-sm">Process ID</h2>
                    <p className="text-[11px] text-slate-400">Login & Signup gate — changes every 24 hours</p>
                  </div>
                </div>
                {/* Enable/Disable toggle */}
                <button
                  onClick={toggleCodeEnabled}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    codeEnabled
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                      : 'bg-red-500/15 border-red-500/30 text-red-300 hover:bg-red-500/25'
                  }`}
                >
                  {codeEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  {codeEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Current Code Display */}
              <div className={`p-4 rounded-xl border ${isDefaultCode ? 'bg-amber-500/10 border-amber-500/30' : 'bg-violet-500/10 border-violet-500/25'}`}>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">
                  {isDefaultCode ? '⚠ No Process ID Set Yet' : `Today's Active Process ID (set: ${codeDate})`}
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-4xl font-black tracking-[0.3em] font-mono text-white">
                    {showCode ? storedCode : '• • • • • •'}
                  </p>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button onClick={() => setShowCode(!showCode)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-violet-300 transition-all cursor-pointer">
                      {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={copyCode} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-violet-300 transition-all cursor-pointer">
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {!codeEnabled && (
                  <p className="text-[11px] text-red-300 mt-2 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Feature disabled — all signups and logins allowed without Process ID
                  </p>
                )}
              </div>

              {/* Set New Code */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-300">Set New Process ID for Today</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit Process ID"
                    maxLength={6}
                    className="h-11 bg-slate-900/60 border-violet-500/30 text-white placeholder:text-slate-500 focus:border-violet-400 rounded-xl font-mono text-lg tracking-widest text-center flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={generateCode}
                    className="h-11 border-violet-500/30 text-violet-300 hover:bg-violet-500/10 cursor-pointer rounded-xl px-3 shrink-0"
                    title="Generate random code"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={saveDailyCode}
                    disabled={savingCode || newCode.length !== 6}
                    className="h-11 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white cursor-pointer rounded-xl px-5 shrink-0 shadow-lg disabled:opacity-50"
                  >
                    {savingCode ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  📌 Ek baar Process ID set karo → WhatsApp support ko batao → Customer signup/login pe ye dalta hai.
                  Ye Process ID har 24 ghante baad change hona chahiye.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ━━━━━ FOUNDER PHOTO ━━━━━ */}
          <Card className="glass-premium border border-white/10 shadow-xl rounded-2xl">
            <CardContent className="p-5 sm:p-6">
              <h2 className="font-bold text-white text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-400" />
                Founder Photo
              </h2>
              <div className="flex items-center gap-4">
                {settings.founderPhoto ? (
                  <img src={settings.founderPhoto} alt="Founder" className="w-20 h-20 rounded-2xl object-cover border-2 border-violet-500/30 shadow-lg" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-slate-400 text-xs">
                    No Photo
                  </div>
                )}
                <div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  <Button variant="outline" onClick={() => fileRef.current?.click()} className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10 cursor-pointer rounded-xl">
                    <Upload className="w-4 h-4 mr-2" /> Upload Photo
                  </Button>
                  <p className="text-xs text-slate-500 mt-1">Max 2MB, image files only</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ━━━━━ OTHER SETTINGS ━━━━━ */}
          <div className="space-y-4">
            {settingFields.map((field) => (
              <Card key={field.key} className="glass-premium border border-white/10 shadow-lg rounded-2xl hover:border-violet-500/30 transition-all duration-300">
                <CardContent className="p-5">
                  <Label className="text-sm font-bold text-slate-300 uppercase tracking-wider text-xs">{field.label}</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      value={settings[field.key] || ''}
                      onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                      className="h-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500/50 rounded-xl flex-1"
                    />
                    <Button
                      onClick={() => handleSave(field.key, settings[field.key] || '')}
                      disabled={savingKey === field.key}
                      size="sm"
                      className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shrink-0 cursor-pointer rounded-xl h-10 px-4"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
