// TypeScript types matching the live Supabase schema (public) for Junior Gym.
// Kept in sync manually — regenerate/update if schema.sql changes.
// Relationships are best-effort based on `*_id` column naming; foreignKeyName
// strings are synthetic (not read from live FK constraints) but sufficient
// for compile-time embedded-select typing.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string;
          department_id: string | null;
          name: string;
        };
        Insert: {
          id?: string;
          department_id?: string | null;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["activities"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "activities_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
        ];
      };
      cash_accounts: {
        Row: { id: string; name: string };
        Insert: { id?: string; name: string };
        Update: Partial<Database["public"]["Tables"]["cash_accounts"]["Insert"]>;
        Relationships: [];
      };
      cost_centers: {
        Row: { id: string; name: string; created_at: string | null };
        Insert: { id?: string; name: string; created_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["cost_centers"]["Insert"]>;
        Relationships: [];
      };
      daily_transactions: {
        Row: {
          id: string;
          seq: number;
          transaction_date: string;
          transaction_type_id: string | null;
          subscription_id: string | null;
          customer_party_id: string | null;
          program_id: string | null;
          employee_party_id: string | null;
          amount: number;
          cash_account_id: string | null;
          expense_category: string | null;
          discount_type: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          seq?: number;
          transaction_date: string;
          transaction_type_id?: string | null;
          subscription_id?: string | null;
          customer_party_id?: string | null;
          program_id?: string | null;
          employee_party_id?: string | null;
          amount: number;
          cash_account_id?: string | null;
          expense_category?: string | null;
          discount_type?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["daily_transactions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "daily_transactions_transaction_type_id_fkey";
            columns: ["transaction_type_id"];
            isOneToOne: false;
            referencedRelation: "transaction_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_transactions_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_transactions_customer_party_id_fkey";
            columns: ["customer_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_transactions_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_transactions_employee_party_id_fkey";
            columns: ["employee_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_transactions_cash_account_id_fkey";
            columns: ["cash_account_id"];
            isOneToOne: false;
            referencedRelation: "cash_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      departments: {
        Row: { id: string; name: string };
        Insert: { id?: string; name: string };
        Update: Partial<Database["public"]["Tables"]["departments"]["Insert"]>;
        Relationships: [];
      };
      financial_statements: {
        Row: { id: string; name: string };
        Insert: { id?: string; name: string };
        Update: Partial<Database["public"]["Tables"]["financial_statements"]["Insert"]>;
        Relationships: [];
      };
      fixed_assets: {
        Row: {
          id: string;
          sub_account_id: string | null;
          name: string;
          cost_center_id: string | null;
          purchase_cost: number;
          purchase_date: string | null;
          monthly_depreciation: number | null;
          accumulated_depreciation: number | null;
        };
        Insert: {
          id?: string;
          sub_account_id?: string | null;
          name: string;
          cost_center_id?: string | null;
          purchase_cost: number;
          purchase_date?: string | null;
          monthly_depreciation?: number | null;
          accumulated_depreciation?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["fixed_assets"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "fixed_assets_sub_account_id_fkey";
            columns: ["sub_account_id"];
            isOneToOne: false;
            referencedRelation: "sub_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fixed_assets_cost_center_id_fkey";
            columns: ["cost_center_id"];
            isOneToOne: false;
            referencedRelation: "cost_centers";
            referencedColumns: ["id"];
          },
        ];
      };
      journal_entries: {
        Row: {
          id: string;
          daily_transaction_id: string | null;
          debit_sub_account_id: string | null;
          credit_sub_account_id: string | null;
          amount: number;
          cost_center_id: string | null;
          is_cogs_entry: boolean | null;
          trainer_party_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          daily_transaction_id?: string | null;
          debit_sub_account_id?: string | null;
          credit_sub_account_id?: string | null;
          amount: number;
          cost_center_id?: string | null;
          is_cogs_entry?: boolean | null;
          trainer_party_id?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["journal_entries"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "journal_entries_daily_transaction_id_fkey";
            columns: ["daily_transaction_id"];
            isOneToOne: false;
            referencedRelation: "daily_transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_entries_debit_sub_account_id_fkey";
            columns: ["debit_sub_account_id"];
            isOneToOne: false;
            referencedRelation: "sub_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_entries_credit_sub_account_id_fkey";
            columns: ["credit_sub_account_id"];
            isOneToOne: false;
            referencedRelation: "sub_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_entries_cost_center_id_fkey";
            columns: ["cost_center_id"];
            isOneToOne: false;
            referencedRelation: "cost_centers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_entries_trainer_party_id_fkey";
            columns: ["trainer_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["id"];
          },
        ];
      };
      main_accounts: {
        Row: {
          id: string;
          financial_statement_id: string | null;
          name: string;
          nature: string;
        };
        Insert: {
          id?: string;
          financial_statement_id?: string | null;
          name: string;
          nature: string;
        };
        Update: Partial<Database["public"]["Tables"]["main_accounts"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "main_accounts_financial_statement_id_fkey";
            columns: ["financial_statement_id"];
            isOneToOne: false;
            referencedRelation: "financial_statements";
            referencedColumns: ["id"];
          },
        ];
      };
      parties: {
        Row: {
          id: string;
          full_name: string;
          phone_1: string | null;
          phone_2: string | null;
          phone_3: string | null;
          referral_source: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone_1?: string | null;
          phone_2?: string | null;
          phone_3?: string | null;
          referral_source?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["parties"]["Insert"]>;
        Relationships: [];
      };
      partners: {
        Row: {
          id: string;
          cost_center_id: string | null;
          name: string;
          share_percent: number | null;
          joined_at: string | null;
          active: boolean | null;
        };
        Insert: {
          id?: string;
          cost_center_id?: string | null;
          name: string;
          share_percent?: number | null;
          joined_at?: string | null;
          active?: boolean | null;
        };
        Update: Partial<Database["public"]["Tables"]["partners"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "partners_cost_center_id_fkey";
            columns: ["cost_center_id"];
            isOneToOne: false;
            referencedRelation: "cost_centers";
            referencedColumns: ["id"];
          },
        ];
      };
      party_roles: {
        Row: {
          id: string;
          party_id: string | null;
          // DB enum — actual allowed values not yet confirmed from schema.sql.
          // Known roles from requirements: owner, accounts_manager, office_accountant,
          // secretary, trainer, employee, customer. Verify/adjust against the DB enum.
          role: string;
          department: string | null;
          cost_center_id: string | null;
          status: string | null;
          started_at: string | null;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          party_id?: string | null;
          role: string;
          department?: string | null;
          cost_center_id?: string | null;
          status?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["party_roles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "party_roles_party_id_fkey";
            columns: ["party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "party_roles_cost_center_id_fkey";
            columns: ["cost_center_id"];
            isOneToOne: false;
            referencedRelation: "cost_centers";
            referencedColumns: ["id"];
          },
        ];
      };
      program_trainer_assignments: {
        Row: {
          id: string;
          program_id: string | null;
          trainer_party_id: string | null;
          commission_percent: number;
          starts_at: string;
          ends_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          program_id?: string | null;
          trainer_party_id?: string | null;
          commission_percent: number;
          starts_at: string;
          ends_at?: string | null;
          created_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["program_trainer_assignments"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "program_trainer_assignments_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "program_trainer_assignments_trainer_party_id_fkey";
            columns: ["trainer_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["id"];
          },
        ];
      };
      programs: {
        Row: {
          id: string;
          activity_id: string | null;
          cost_center_id: string | null;
          name: string;
          session_count: number | null;
          duration_type: string | null;
          session_days: string[] | null;
          session_time: string | null;
          location: string | null;
          price: number;
          price_per_session: number | null;
          active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          activity_id?: string | null;
          cost_center_id?: string | null;
          name: string;
          session_count?: number | null;
          duration_type?: string | null;
          session_days?: string[] | null;
          session_time?: string | null;
          location?: string | null;
          price: number;
          price_per_session?: number | null;
          active?: boolean | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["programs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "programs_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programs_cost_center_id_fkey";
            columns: ["cost_center_id"];
            isOneToOne: false;
            referencedRelation: "cost_centers";
            referencedColumns: ["id"];
          },
        ];
      };
      sub_accounts: {
        Row: {
          id: string;
          main_account_id: string | null;
          name: string;
          cost_center_id: string | null;
        };
        Insert: {
          id?: string;
          main_account_id?: string | null;
          name: string;
          cost_center_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["sub_accounts"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "sub_accounts_main_account_id_fkey";
            columns: ["main_account_id"];
            isOneToOne: false;
            referencedRelation: "main_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sub_accounts_cost_center_id_fkey";
            columns: ["cost_center_id"];
            isOneToOne: false;
            referencedRelation: "cost_centers";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_sessions: {
        Row: {
          id: string;
          subscription_id: string | null;
          session_number: number;
          expected_date: string | null;
          actual_date: string | null;
          status: string | null;
        };
        Insert: {
          id?: string;
          subscription_id?: string | null;
          session_number: number;
          expected_date?: string | null;
          actual_date?: string | null;
          status?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["subscription_sessions"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "subscription_sessions_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          code: number;
          customer_party_id: string | null;
          program_id: string | null;
          session_count: number;
          price: number;
          discount_amount: number | null;
          discount_type: string | null;
          price_per_session_after_discount: number | null;
          trainer_assignment_snapshot: Json | null;
          started_at: string;
          ends_at: string | null;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          code?: number;
          customer_party_id?: string | null;
          program_id?: string | null;
          session_count: number;
          price: number;
          discount_amount?: number | null;
          discount_type?: string | null;
          price_per_session_after_discount?: number | null;
          trainer_assignment_snapshot?: Json | null;
          started_at: string;
          ends_at?: string | null;
          status?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "subscriptions_customer_party_id_fkey";
            columns: ["customer_party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
        ];
      };
      transaction_types: {
        Row: {
          id: string;
          name: string;
          debit_sub_account_id: string | null;
          credit_sub_account_id: string | null;
          generates_entry: boolean | null;
          triggers_cogs: boolean | null;
        };
        Insert: {
          id?: string;
          name: string;
          debit_sub_account_id?: string | null;
          credit_sub_account_id?: string | null;
          generates_entry?: boolean | null;
          triggers_cogs?: boolean | null;
        };
        Update: Partial<Database["public"]["Tables"]["transaction_types"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "transaction_types_debit_sub_account_id_fkey";
            columns: ["debit_sub_account_id"];
            isOneToOne: false;
            referencedRelation: "sub_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_types_credit_sub_account_id_fkey";
            columns: ["credit_sub_account_id"];
            isOneToOne: false;
            referencedRelation: "sub_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
