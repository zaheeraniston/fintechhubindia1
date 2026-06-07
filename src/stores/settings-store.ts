import { create } from 'zustand';

interface GlobalSettings {
  founderName: string;
  founderPhoto: string;
  customerCareLink: string;
  whatsappLink: string;
}

interface SettingsStore {
  settings: GlobalSettings;
  setSettings: (s: GlobalSettings) => void;
  updateSetting: (key: keyof GlobalSettings, value: string | boolean) => void;
}

const defaultSettings: GlobalSettings = {
  founderName: 'Fintech Hub India',
  founderPhoto: '',
  customerCareLink: 'https://wa.me/919462547328',
  whatsappLink: 'https://wa.me/919462547328',
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,
  setSettings: (s) => set({ settings: s }),
  updateSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    })),
}));
