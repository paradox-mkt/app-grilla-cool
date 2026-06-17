// Hand-written types matching db/migrations/*.sql.
export type AppRole = "admin" | "editor" | "viewer";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: AppRole;
  created_at: string;
}
export interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  color: string;
  description: string | null;
  created_at: string;
}
export interface BrandAccess {
  id: string;
  brand_id: string;
  user_id: string;
  granted_by: string | null;
  created_at: string;
}
export interface ContentItem {
  id: string;
  brand_id: string;
  user_id: string;
  title: string;
  description: string | null;
  date: string;
  format: string;
  status: string;
  file_url: string | null;
  external_links: string[];
  notes: string | null;
  objective: string | null;
  paid_type: string | null;
  campaign: string | null;
  image_text: string | null;
  copy: string | null;
  platforms: string[];
  importance: string;
  is_overdue: boolean;
  scheduled_at: string | null;
  publish_at: string | null;
  delivery_date: string | null;
  references_data: unknown;
  final_designs: unknown;
  created_at: string;
  updated_at: string;
}
export interface Idea {
  id: string;
  brand_id: string;
  user_id: string;
  title: string;
  description: string | null;
  references_data: unknown;
  converted_to_publication: boolean;
  converted_publication_id: string | null;
  created_at: string;
}
export interface ShareToken {
  id: string;
  brand_id: string;
  token: string;
  created_by: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}
export interface Comment {
  id: string;
  content_item_id: string;
  share_token_id: string | null;
  author_name: string;
  author_email: string | null;
  message: string;
  created_at: string;
}

type Insert<T, Optional extends keyof T> = Omit<T, Optional> & Partial<Pick<T, Optional>>;

export interface Database {
  public: {
    Tables: {
      profiles:      { Row: Profile;     Insert: Insert<Profile, "created_at" | "avatar_url" | "full_name" | "email" | "role">; Update: Partial<Profile> };
      brands:        { Row: Brand;       Insert: Insert<Brand, "id" | "created_at" | "logo_url" | "color" | "description">;     Update: Partial<Brand> };
      brand_access:  { Row: BrandAccess; Insert: Insert<BrandAccess, "id" | "created_at" | "granted_by">;                       Update: Partial<BrandAccess> };
      content_items: { Row: ContentItem; Insert: Insert<ContentItem,
        "id" | "created_at" | "updated_at" | "description" | "file_url" | "notes"
        | "objective" | "paid_type" | "campaign" | "image_text" | "copy"
        | "platforms" | "external_links" | "importance" | "is_overdue"
        | "scheduled_at" | "publish_at" | "delivery_date" | "references_data" | "final_designs"
        | "status" | "format" | "title">;                                                                                       Update: Partial<ContentItem> };
      ideas:         { Row: Idea;        Insert: Insert<Idea, "id" | "created_at" | "description" | "references_data" | "converted_to_publication" | "converted_publication_id">; Update: Partial<Idea> };
      share_tokens:  { Row: ShareToken;  Insert: Insert<ShareToken, "id" | "created_at" | "token" | "created_by" | "expires_at" | "is_active">; Update: Partial<ShareToken> };
      comments:      { Row: Comment;     Insert: Insert<Comment, "id" | "created_at" | "share_token_id" | "author_email">;       Update: Partial<Comment> };
    };
    Views: Record<string, never>;
    Functions: {
      has_role:          { Args: { _user_id: string; _role: AppRole }; Returns: boolean };
      has_brand_access:  { Args: { _user_id: string; _brand_id: string }; Returns: boolean };
      share_token_brand: { Args: { _token: string }; Returns: string };
    };
    Enums: { app_role: AppRole };
  };
}
