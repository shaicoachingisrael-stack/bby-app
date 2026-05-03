import { useEffect, useState } from 'react';

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
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.warn('profile fetch error', error);
        setProfile(data as Profile | null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function update(patch: Partial<Omit<Profile, 'id'>>) {
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
  }

  return { profile, loading, update };
}
