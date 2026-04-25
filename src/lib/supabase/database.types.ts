// Tipi Supabase — rigenera con:
//   npx supabase gen types typescript --project-id <id> --schema public > src/lib/supabase/database.types.ts
// Per ora definizione manuale allineata a supabase/migrations/0001_initial.sql.
// Shape conforme a @supabase/supabase-js >=2.47 (Relationships obbligatorio).

export type UserRole = "admin" | "coach" | "user";
export type WorkoutStructure = "weekly" | "rotation" | "single";
export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

export interface ProfileRow {
  id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  date_of_birth: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExerciseRow {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
  description: string | null;
  video_url: string | null;
  is_preset: boolean;
  created_by: string | null;
  created_at: string;
}

export interface WorkoutRow {
  id: string;
  user_id: string;
  coach_id: string;
  title: string;
  description: string | null;
  structure: WorkoutStructure;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutDayRow {
  id: string;
  workout_id: string;
  label: string;
  order_index: number;
  notes: string | null;
}

export interface WorkoutExerciseRow {
  id: string;
  workout_day_id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  target_reps: string;
  target_weight: string | null;
  rest_seconds: number | null;
  notes: string | null;
}

export interface WorkoutLogRow {
  id: string;
  user_id: string;
  workout_day_id: string;
  performed_at: string;
  duration_minutes: number | null;
  overall_notes: string | null;
}

export interface ExerciseLogRow {
  id: string;
  workout_log_id: string;
  workout_exercise_id: string;
  set_number: number;
  weight_kg: number | null;
  reps_done: number | null;
  completed: boolean;
  notes: string | null;
}

export interface InviteRow {
  id: string;
  email: string;
  role: UserRole;
  invited_by: string;
  token: string;
  status: InviteStatus;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface ActivityLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      exercises: {
        Row: ExerciseRow;
        Insert: Omit<ExerciseRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<ExerciseRow>;
        Relationships: [];
      };
      workouts: {
        Row: WorkoutRow;
        Insert: Omit<WorkoutRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<WorkoutRow>;
        Relationships: [];
      };
      workout_days: {
        Row: WorkoutDayRow;
        Insert: Omit<WorkoutDayRow, "id"> & { id?: string };
        Update: Partial<WorkoutDayRow>;
        Relationships: [];
      };
      workout_exercises: {
        Row: WorkoutExerciseRow;
        Insert: Omit<WorkoutExerciseRow, "id"> & { id?: string };
        Update: Partial<WorkoutExerciseRow>;
        Relationships: [];
      };
      workout_logs: {
        Row: WorkoutLogRow;
        Insert: Omit<WorkoutLogRow, "id" | "performed_at"> & {
          id?: string;
          performed_at?: string;
        };
        Update: Partial<WorkoutLogRow>;
        Relationships: [];
      };
      exercise_logs: {
        Row: ExerciseLogRow;
        Insert: Omit<ExerciseLogRow, "id"> & { id?: string };
        Update: Partial<ExerciseLogRow>;
        Relationships: [];
      };
      invites: {
        Row: InviteRow;
        Insert: Omit<InviteRow, "id" | "created_at" | "expires_at" | "status"> & {
          id?: string;
          created_at?: string;
          expires_at?: string;
          status?: InviteStatus;
        };
        Update: Partial<InviteRow>;
        Relationships: [];
      };
      activity_logs: {
        Row: ActivityLogRow;
        Insert: Omit<ActivityLogRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<ActivityLogRow>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
    };
    Enums: {
      user_role: UserRole;
      workout_structure: WorkoutStructure;
      invite_status: InviteStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
