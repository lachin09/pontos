export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string;
          is_active: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          is_active?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          is_active?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          image_url: string | null;
          is_active: boolean;
          name: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          color: string;
          id: string;
          order_id: string;
          price: number;
          product_id: string;
          product_image: string | null;
          product_name: string;
          quantity: number;
          size: string;
          subtotal: number | null;
          variant_id: string;
        };
        Insert: {
          color: string;
          id?: string;
          order_id: string;
          price: number;
          product_id: string;
          product_image?: string | null;
          product_name: string;
          quantity: number;
          size: string;
          subtotal?: number | null;
          variant_id: string;
        };
        Update: {
          color?: string;
          id?: string;
          order_id?: string;
          price?: number;
          product_id?: string;
          product_image?: string | null;
          product_name?: string;
          quantity?: number;
          size?: string;
          subtotal?: number | null;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          city: string;
          comment: string | null;
          created_at: string;
          delivery_address: string;
          delivery_country_code: string;
          delivery_method: Database["public"]["Enums"]["delivery_method"];
          delivery_postal_code: string | null;
          nova_poshta_division_id: number | null;
          nova_poshta_division_name: string | null;
          nova_poshta_division_category: string | null;
          delivery_price: number;
          first_name: string;
          id: string;
          idempotency_key: string;
          last_name: string;
          order_number: number;
          payment_method: Database["public"]["Enums"]["payment_method"];
          payment_status: Database["public"]["Enums"]["payment_status"];
          phone: string;
          public_token: string;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          telegram_chat_id: number | null;
          total: number;
          updated_at: string;
        };
        Insert: {
          city: string;
          comment?: string | null;
          created_at?: string;
          delivery_address: string;
          delivery_country_code?: string;
          delivery_method: Database["public"]["Enums"]["delivery_method"];
          delivery_postal_code?: string | null;
          nova_poshta_division_id?: number | null;
          nova_poshta_division_name?: string | null;
          nova_poshta_division_category?: string | null;
          delivery_price?: number;
          first_name: string;
          id?: string;
          idempotency_key?: string;
          last_name: string;
          order_number?: number;
          payment_method: Database["public"]["Enums"]["payment_method"];
          payment_status?: Database["public"]["Enums"]["payment_status"];
          phone: string;
          public_token?: string;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          telegram_chat_id?: number | null;
          total: number;
          updated_at?: string;
        };
        Update: {
          city?: string;
          comment?: string | null;
          created_at?: string;
          delivery_address?: string;
          delivery_country_code?: string;
          delivery_method?: Database["public"]["Enums"]["delivery_method"];
          delivery_postal_code?: string | null;
          nova_poshta_division_id?: number | null;
          nova_poshta_division_name?: string | null;
          nova_poshta_division_category?: string | null;
          delivery_price?: number;
          first_name?: string;
          id?: string;
          idempotency_key?: string;
          last_name?: string;
          order_number?: number;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          payment_status?: Database["public"]["Enums"]["payment_status"];
          phone?: string;
          public_token?: string;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          telegram_chat_id?: number | null;
          total?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_notifications: {
        Row: {
          id: string;
          order_id: string;
          order_number: number;
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          order_number: number;
          title: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          order_number?: number;
          title?: string;
          message?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_notifications_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          changed_by: string;
          old_status: Database["public"]["Enums"]["order_status"];
          new_status: Database["public"]["Enums"]["order_status"];
          old_payment_status: Database["public"]["Enums"]["payment_status"];
          new_payment_status: Database["public"]["Enums"]["payment_status"];
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      product_images: {
        Row: {
          alt: string;
          color: string | null;
          created_at: string;
          id: string;
          product_id: string;
          sort_order: number;
          storage_path: string;
        };
        Insert: {
          alt?: string;
          color?: string | null;
          created_at?: string;
          id?: string;
          product_id: string;
          sort_order?: number;
          storage_path: string;
        };
        Update: {
          alt?: string;
          color?: string | null;
          created_at?: string;
          id?: string;
          product_id?: string;
          sort_order?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          color: string;
          color_hex: string;
          created_at: string;
          id: string;
          is_available: boolean;
          price: number;
          product_id: string;
          size: string;
          sku: string;
          stock: number;
          updated_at: string;
        };
        Insert: {
          color: string;
          color_hex: string;
          created_at?: string;
          id?: string;
          is_available?: boolean;
          price: number;
          product_id: string;
          size: string;
          sku: string;
          stock?: number;
          updated_at?: string;
        };
        Update: {
          color?: string;
          color_hex?: string;
          created_at?: string;
          id?: string;
          is_available?: boolean;
          price?: number;
          product_id?: string;
          size?: string;
          sku?: string;
          stock?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          care_instructions: string;
          category_id: string;
          composition: string;
          created_at: string;
          description: string;
          id: string;
          is_available: boolean;
          is_featured: boolean;
          is_new: boolean;
          is_published: boolean;
          is_sale: boolean;
          name: string;
          old_price: number | null;
          price: number;
          slug: string;
          updated_at: string;
        };
        Insert: {
          care_instructions?: string;
          category_id: string;
          composition?: string;
          created_at?: string;
          description?: string;
          id?: string;
          is_available?: boolean;
          is_featured?: boolean;
          is_new?: boolean;
          is_published?: boolean;
          is_sale?: boolean;
          name: string;
          old_price?: number | null;
          price: number;
          slug: string;
          updated_at?: string;
        };
        Update: {
          care_instructions?: string;
          category_id?: string;
          composition?: string;
          created_at?: string;
          description?: string;
          id?: string;
          is_available?: boolean;
          is_featured?: boolean;
          is_new?: boolean;
          is_published?: boolean;
          is_sale?: boolean;
          name?: string;
          old_price?: number | null;
          price?: number;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      store_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_order_secure: {
        Args: {
          p_customer: Json;
          p_idempotency_key: string;
          p_items: Json;
          p_public_storage_url: string;
        };
        Returns: {
          order_number: number;
          payment_status: Database["public"]["Enums"]["payment_status"];
          total: number;
          was_created: boolean;
        }[];
      };
      is_active_admin: { Args: never; Returns: boolean };
      update_order_admin: {
        Args: {
          p_order_id: string;
          p_status: Database["public"]["Enums"]["order_status"];
          p_payment_status: Database["public"]["Enums"]["payment_status"];
        };
        Returns: boolean;
      };
      save_product_with_variants: {
        Args: { p_product: Json; p_product_id: string; p_variants: Json };
        Returns: string;
      };
      save_product_with_variants_internal: {
        Args: { p_product: Json; p_product_id: string; p_variants: Json };
        Returns: string;
      };
    };
    Enums: {
      delivery_method: "nova_poshta" | "ukrposhta" | "courier";
      order_status:
        | "new"
        | "confirmed"
        | "payment_pending"
        | "paid"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled";
      payment_method: "bank_transfer" | "cash_on_delivery";
      payment_status:
        | "pending"
        | "awaiting_confirmation"
        | "paid"
        | "cash_on_delivery"
        | "failed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          lifecycle_configuration: Json | null;
          lifecycle_configuration_generation: string | null;
          name: string;
          owner: string | null;
          owner_id: string | null;
          public: boolean | null;
          type: Database["storage"]["Enums"]["buckettype"];
          updated_at: string | null;
          versioning_status: string;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          lifecycle_configuration?: Json | null;
          lifecycle_configuration_generation?: string | null;
          name: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string | null;
          versioning_status?: string;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          lifecycle_configuration?: Json | null;
          lifecycle_configuration_generation?: string | null;
          name?: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string | null;
          versioning_status?: string;
        };
        Relationships: [];
      };
      buckets_analytics: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          format: string;
          id: string;
          name: string;
          type: Database["storage"]["Enums"]["buckettype"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          format?: string;
          id?: string;
          name: string;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          format?: string;
          id?: string;
          name?: string;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string;
        };
        Relationships: [];
      };
      buckets_vectors: {
        Row: {
          created_at: string;
          id: string;
          type: Database["storage"]["Enums"]["buckettype"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string;
        };
        Relationships: [];
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          archived_at: string | null;
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          is_delete_marker: boolean;
          is_versioned: boolean;
          last_accessed_at: string | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          owner_id: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          user_metadata: Json | null;
          version: string | null;
        };
        Insert: {
          archived_at?: string | null;
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_delete_marker?: boolean;
          is_versioned?: boolean;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Update: {
          archived_at?: string | null;
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_delete_marker?: boolean;
          is_versioned?: boolean;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
      s3_multipart_uploads: {
        Row: {
          bucket_id: string;
          created_at: string;
          id: string;
          in_progress_size: number;
          key: string;
          metadata: Json | null;
          owner_id: string | null;
          upload_signature: string;
          user_metadata: Json | null;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          id: string;
          in_progress_size?: number;
          key: string;
          metadata?: Json | null;
          owner_id?: string | null;
          upload_signature: string;
          user_metadata?: Json | null;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          id?: string;
          in_progress_size?: number;
          key?: string;
          metadata?: Json | null;
          owner_id?: string | null;
          upload_signature?: string;
          user_metadata?: Json | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string;
          created_at: string;
          etag: string;
          id: string;
          key: string;
          owner_id: string | null;
          part_number: number;
          size: number;
          upload_id: string;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          etag: string;
          id?: string;
          key: string;
          owner_id?: string | null;
          part_number: number;
          size?: number;
          upload_id: string;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          etag?: string;
          id?: string;
          key?: string;
          owner_id?: string | null;
          part_number?: number;
          size?: number;
          upload_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey";
            columns: ["upload_id"];
            isOneToOne: false;
            referencedRelation: "s3_multipart_uploads";
            referencedColumns: ["id"];
          },
        ];
      };
      vector_indexes: {
        Row: {
          bucket_id: string;
          created_at: string;
          data_type: string;
          dimension: number;
          distance_metric: string;
          id: string;
          metadata_configuration: Json | null;
          name: string;
          updated_at: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          data_type: string;
          dimension: number;
          distance_metric: string;
          id?: string;
          metadata_configuration?: Json | null;
          name: string;
          updated_at?: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          data_type?: string;
          dimension?: number;
          distance_metric?: string;
          id?: string;
          metadata_configuration?: Json | null;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets_vectors";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] };
        Returns: boolean;
      };
      allow_only_operation: {
        Args: { expected_operation: string };
        Returns: boolean;
      };
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string };
        Returns: undefined;
      };
      extension: { Args: { name: string }; Returns: string };
      filename: { Args: { name: string }; Returns: string };
      foldername: { Args: { name: string }; Returns: string[] };
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string };
        Returns: string;
      };
      get_size_by_bucket: {
        Args: { delete_markers?: string; noncurrent_versions?: string };
        Returns: {
          bucket_id: string;
          size: number;
        }[];
      };
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string;
          delimiter_param: string;
          max_keys?: number;
          next_key_token?: string;
          next_upload_token?: string;
          prefix_param: string;
          raw_prefix_param?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
        }[];
      };
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string;
          delete_markers?: string;
          delimiter_param: string;
          max_keys?: number;
          next_token?: string;
          next_token_archived_at?: string;
          next_token_version?: string;
          noncurrent_versions?: string;
          prefix_param: string;
          sort_order?: string;
          start_after?: string;
        };
        Returns: {
          archived_at: string;
          created_at: string;
          id: string;
          is_delete_marker: boolean;
          is_versioned: boolean;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
          version: string;
        }[];
      };
      operation: { Args: never; Returns: string };
      search: {
        Args: {
          bucketname: string;
          delete_markers?: string;
          levels?: number;
          limits?: number;
          noncurrent_versions?: string;
          offsets?: number;
          prefix: string;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          archived_at: string;
          created_at: string;
          id: string;
          is_delete_marker: boolean;
          is_versioned: boolean;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
          version: string;
        }[];
      };
      search_by_timestamp: {
        Args: {
          delete_markers?: string;
          noncurrent_versions?: string;
          p_bucket_id: string;
          p_level: number;
          p_limit: number;
          p_prefix: string;
          p_sort_column: string;
          p_sort_column_after: string;
          p_sort_order: string;
          p_start_after: string;
          p_start_after_version?: string;
        };
        Returns: {
          archived_at: string;
          created_at: string;
          id: string;
          is_delete_marker: boolean;
          is_versioned: boolean;
          key: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
          version: string;
        }[];
      };
      search_v2: {
        Args: {
          bucket_name: string;
          delete_markers?: string;
          levels?: number;
          limits?: number;
          noncurrent_versions?: string;
          prefix: string;
          sort_column?: string;
          sort_column_after?: string;
          sort_order?: string;
          start_after?: string;
          start_after_archived_at?: string;
          start_after_is_continuation?: boolean;
          start_after_version?: string;
        };
        Returns: {
          archived_at: string;
          created_at: string;
          id: string;
          is_delete_marker: boolean;
          is_versioned: boolean;
          key: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
          version: string;
        }[];
      };
    };
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      delivery_method: ["nova_poshta", "ukrposhta", "courier"],
      order_status: [
        "new",
        "confirmed",
        "payment_pending",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_method: ["bank_transfer", "cash_on_delivery"],
      payment_status: [
        "pending",
        "awaiting_confirmation",
        "paid",
        "cash_on_delivery",
        "failed",
      ],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const;
