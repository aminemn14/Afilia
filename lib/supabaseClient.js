import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

// Récupération des variables d'environnement
const { supabaseUrl, supabaseAnonKey } = Constants.expoConfig.extra;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('La configuration de Supabase est manquante');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
