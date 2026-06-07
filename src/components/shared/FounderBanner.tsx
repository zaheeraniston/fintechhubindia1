'use client';

import { useSettingsStore } from '@/stores/settings-store';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function FounderBanner() {
  const { settings, setSettings } = useSettingsStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await apiFetch('/settings');
        if (data.map) {
          const newSettings = { ...settings };
          if (data.map.founderName) newSettings.founderName = data.map.founderName;
          if (data.map.founderPhoto) newSettings.founderPhoto = data.map.founderPhoto;
          if (data.map.customerCareLink) newSettings.customerCareLink = data.map.customerCareLink;
          if (data.map.whatsappLink) newSettings.whatsappLink = data.map.whatsappLink;
          setSettings(newSettings);
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-700 via-teal-600 to-emerald-600 px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 animate-pulse" />
        <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
      </div>
    );
  }

  const founderInitial = settings.founderName?.charAt(0) || 'F';

  return (
    <div className="bg-gradient-to-r from-blue-700 via-teal-600 to-emerald-600 px-4 py-3 flex items-center gap-3 shadow-lg">
      <Avatar className="w-10 h-10 border-2 border-white/50 shadow-md shrink-0">
        {settings.founderPhoto ? (
          <AvatarImage src={settings.founderPhoto} alt={settings.founderName} />
        ) : null}
        <AvatarFallback className="bg-white/20 text-white font-bold text-sm">
          {founderInitial}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-white font-semibold text-sm leading-tight">{settings.founderName}</p>
        <p className="text-white/70 text-xs">Founder & CEO</p>
      </div>
    </div>
  );
}
