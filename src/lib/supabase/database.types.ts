// Tipi Supabase — rigenera con:
//   npx supabase gen types typescript --project-id <id> --schema public > src/lib/supabase/database.types.ts
// Per ora una definizione minima manuale per avere autocompletamento.

export type UserRole = "admin" | "coach" | "user";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          date_of_birth: string | null;
          locked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      coach_athletes: {
        Row: {
          id: string;
          coach_id: string;
          athlete_id: string;
          active: boolean;
          assigned_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["coach_athletes"]["Row"], "id" | "assigned_at"> & {
          id?: string;
          assigned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["coach_athletes"]["Row"]>;
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          muscle_group: string;
          equipment: string | null;
          description: string | null;
          video_url: string | null;
          created_by: string | null;
          is_public: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["exercises"]["Row"]> & {
          name: string;
          muscle_group: string;
        };
        Update: Partial<Database["public"]["Tables"]["exercises"]["Row"]>;
      };
      workout_plans: {
        Row: {
          id: string;
          coach_id: string;
          athlete_id: string;
          title: string;
          notes: string | null;
          start_date: string | null;
          end_date: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workout_plans"]["Row"]> & {
          coach_id: string;
          athlete_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_plans"]["Row"]>;
      };
      plan_days: {
        Row: {
          id: string;
          plan_id: string;
          day_number: number;
          name: string;
        };
        Insert: Partial<Database["public"]["Tables"]["plan_days"]["Row"]> & {
          plan_id: string;
          day_number: number;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["plan_days"]["Row"]>;
      };
      plan_exercises: {
        Row: {
          id: string;
          plan_day_id: string;
          exercise_id: string;
          order_index: number;
          sets: number;
          reps: string;
          rest_seconds: number | null;
          weight_kg: number | null;
          notes: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["plan_exercises"]["Row"]> & {
          plan_day_id: string;
          exercise_id: string;
          sets: number;
          reps: string;
        };
        Update: Partial<Database["public"]["Tables"]["plan_exercises"]["Row"]>;
      };
      workout_logs: {
        Row: {
          id: string;
          athlete_id: string;
          plan_exercise_id: string | null;
          exercise_id: string;
          performed_at: string;
          sets_completed: number;
          reps_completed: string | null;
          weight_kg: number | null;
          notes: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["workout_logs"]["Row"]> & {
          athlete_id: string;
          exercise_id: string;
          sets_completed: number;
        };
        Update: Partial<Database["public"]["Tables"]["workout_logs"]["Row"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]> & { action: string };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
      };
    };
    Enums: {
      user_role: UserRole;
    };
  };
};
