import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { supabase } from './supabase';
import { useAuth } from './auth-provider';

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  goal: string | null;
  fitness_level: string | null;
  daily_kcal_target: number | null;
  protein_target_g: number | null;
  hydration_target_ml: number | null;
  onboarded_at: string | null;
  is_admin: boolean;
  // Nutrition module inputs
  sex: 'female' | 'male' | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  goal_intensity: 'gentle' | 'moderate' | 'intense' | null;
  macro_split: 'balanced' | 'high_protein' | null;
};

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  update: (patch: Partial<Omit<Profile, 'id'>>) => Promise<Profile>;
  refresh: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
  update: async () => {
    throw new Error('ProfileProvider missing');
  },
  refresh: async () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (error) console.warn('profile fetch error', error);
    setProfile((data as Profile | null) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const update = useCallback(
    async (patch: Partial<Omit<Profile, 'id'>>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(data as Profile);
      return data as Profile;
    },
    [user],
  );

  return (
    <ProfileContext.Provider value={{ profile, loading, update, refresh }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
