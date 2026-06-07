'use client';

import { useSettingsStore } from '@/stores/settings-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Clock, Shield, Heart, Zap } from 'lucide-react';

export function CustomerCarePage() {
  const { settings } = useSettingsStore();

  const rawLink = settings.customerCareLink || settings.whatsappLink || 'https://wa.me/919462547328';
  // Auto-add https:// if admin entered link without protocol (e.g., wa.me/... or www.whatsapp.com)
  const whatsappLink = rawLink.startsWith('http://') || rawLink.startsWith('https://')
    ? rawLink
    : `https://${rawLink}`;

  return (
    <div className="p-4 sm:p-6 max-w-lg mx-auto space-y-5 relative z-10">
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-2xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent tracking-wide flex items-center justify-center gap-2">
          <MessageCircle className="w-6 h-6 text-violet-400" /> Customer Support
        </h1>
        <p className="text-sm text-slate-400 mt-1 font-medium">We&apos;re always here to help you</p>
      </div>

      {/* Main WhatsApp CTA Card */}
      <Card className="glass-premium border border-white/10 shadow-2xl overflow-hidden rounded-3xl card-hover-3d relative">
        {/* WhatsApp Header */}
        <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 p-8 text-center overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-4 left-4 w-16 h-16 bg-white/5 rounded-full" />

          {/* WhatsApp Icon */}
          <div className="relative z-10 w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-5 shadow-2xl ring-4 ring-white/20">
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-white" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>

          <h2 className="relative z-10 text-white font-bold text-xl mb-1">Chat with us on WhatsApp</h2>
          <p className="relative z-10 text-white/80 text-sm">Quick response &bull; Easy support &bull; 24/7 Available</p>
        </div>

        {/* CTA Section */}
        <CardContent className="p-6 space-y-4">
          {/* Main WhatsApp Button */}
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="block">
            <Button className="w-full h-13 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold shadow-lg shadow-violet-500/25 transition-all duration-300 rounded-xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] text-base">
              <MessageCircle className="w-5 h-5 mr-2" /> Chat on WhatsApp
            </Button>
          </a>



          {/* Info badges */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/5">
              <Clock className="w-5 h-5 text-violet-400 mb-1" />
              <span className="text-[11px] font-semibold text-slate-200 text-center leading-tight">Quick Reply</span>
              <span className="text-[9px] text-slate-400 mt-0.5">Under 2 hrs</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/5">
              <Shield className="w-5 h-5 text-indigo-400 mb-1" />
              <span className="text-[11px] font-semibold text-slate-200 text-center leading-tight">Secure Chat</span>
              <span className="text-[9px] text-slate-400 mt-0.5">End-to-End</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/5">
              <Zap className="w-5 h-5 text-fuchsia-400 mb-1" />
              <span className="text-[11px] font-semibold text-slate-200 text-center leading-tight">Instant</span>
              <span className="text-[9px] text-slate-400 mt-0.5">Real-time</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How it Works Card */}
      <Card className="glass-premium border border-white/10 shadow-lg rounded-2xl relative overflow-hidden">
        <CardContent className="p-5">
          <h3 className="font-bold text-base text-slate-100 mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" /> How Support Works
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 text-violet-300 font-bold text-sm">1</div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Click &quot;Chat on WhatsApp&quot;</p>
                <p className="text-xs text-slate-400">Opens WhatsApp directly with our support number</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center shrink-0 text-fuchsia-300 font-bold text-sm">2</div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Send your query</p>
                <p className="text-xs text-slate-400">Type your issue, question, or feedback</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-300 font-bold text-sm">3</div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Get instant resolution</p>
                <p className="text-xs text-slate-400">Our team responds quickly with solutions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Quick Links */}
      <Card className="glass-premium border border-white/10 shadow-lg rounded-2xl relative overflow-hidden">
        <CardContent className="p-5">
          <h3 className="font-bold text-base text-slate-100 mb-3 uppercase tracking-wider text-xs">Common Questions</h3>
          <div className="space-y-2">
            {[
              'How to submit a report?',
              'When will I get my payout?',
              'How to get my Process ID?',
              'How does the referral system work?',
            ].map((q, i) => (
              <a
                key={i}
                href={`${whatsappLink}?text=${encodeURIComponent(q)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-violet-600/10 border border-white/5 hover:border-violet-500/30 transition-all duration-300 group"
              >
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 group-hover:bg-violet-500/30 flex items-center justify-center shrink-0 transition-colors">
                  <MessageCircle className="w-3.5 h-3.5 text-violet-300" />
                </div>
                <span className="text-sm text-slate-300 group-hover:text-violet-200 font-semibold transition-colors">{q}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Number Display */}
      <Card className="border border-white/10 shadow-md bg-gradient-to-r from-violet-950/40 to-indigo-950/40 rounded-2xl">
        <CardContent className="p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">WhatsApp Number</p>
          <p className="text-lg font-black text-violet-300 tracking-wide font-mono">+91 94625 47328</p>
          <p className="text-[11px] text-slate-500 mt-1">Save this number for quick access</p>
        </CardContent>
      </Card>
    </div>
  );
}
