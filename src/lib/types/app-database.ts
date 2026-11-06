import type { Role } from "@/lib/auth/routing";

// TEMPORARY. Hand-copied from BUILD_GUIDE.md Section 3 so auth code can compile
// before Lane DB's migrations exist. Once `npm run db:types` has produced real
// types, replace everything below with:
//   export type { Database as AppDatabase } from "./database";

type Table<Row, Insert> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};

type LinkStatus = "pending" | "active" | "revoked";

type Profile = {
  id: string;
  role: Role;
  display_name: string;
  locale: string;
  age_band: string | null;
  a11y: Record<string, unknown>;
  created_at: string | null;
};

type GuardianLink = {
  id: string;
  teen_id: string;
  parent_id: string | null;
  invite_code: string;
  status: LinkStatus;
  share_level: string;
  created_at: string | null;
};

export type AppDatabase = {
  public: {
    Tables: {
      profiles: Table<
        Profile,
        Pick<Profile, "id" | "role" | "display_name"> & Partial<Profile>
      >;
      guardian_links: Table<
        GuardianLink,
        Pick<GuardianLink, "teen_id" | "invite_code"> & Partial<GuardianLink>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
