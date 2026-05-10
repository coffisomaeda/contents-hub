export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
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
      books: {
        Row: {
          author: string | null;
          author_kana: string | null;
          id: string;
          isbn: string | null;
          item_price: number | null;
          publisher_name: string | null;
          rakuten_genre_id: string | null;
          review_average: number | null;
          review_count: number | null;
        };
        Insert: {
          author?: string | null;
          author_kana?: string | null;
          id: string;
          isbn?: string | null;
          item_price?: number | null;
          publisher_name?: string | null;
          rakuten_genre_id?: string | null;
          review_average?: number | null;
          review_count?: number | null;
        };
        Update: {
          author?: string | null;
          author_kana?: string | null;
          id?: string;
          isbn?: string | null;
          item_price?: number | null;
          publisher_name?: string | null;
          rakuten_genre_id?: string | null;
          review_average?: number | null;
          review_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'books_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'contents';
            referencedColumns: ['id'];
          },
        ];
      };
      content_list_items: {
        Row: {
          content_id: string;
          created_at: string;
          id: string;
          list_id: string;
          position: number;
        };
        Insert: {
          content_id: string;
          created_at?: string;
          id?: string;
          list_id: string;
          position?: number;
        };
        Update: {
          content_id?: string;
          created_at?: string;
          id?: string;
          list_id?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'content_list_items_content_id_fkey';
            columns: ['content_id'];
            isOneToOne: false;
            referencedRelation: 'contents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'content_list_items_list_id_fkey';
            columns: ['list_id'];
            isOneToOne: false;
            referencedRelation: 'content_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      content_lists: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          owner_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          owner_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          owner_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'content_lists_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      content_shares: {
        Row: {
          content_id: string;
          created_at: string;
          id: string;
          message: string | null;
          recipient_id: string;
          sharer_id: string;
        };
        Insert: {
          content_id: string;
          created_at?: string;
          id?: string;
          message?: string | null;
          recipient_id: string;
          sharer_id: string;
        };
        Update: {
          content_id?: string;
          created_at?: string;
          id?: string;
          message?: string | null;
          recipient_id?: string;
          sharer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'content_shares_content_id_fkey';
            columns: ['content_id'];
            isOneToOne: false;
            referencedRelation: 'contents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'content_shares_recipient_id_fkey';
            columns: ['recipient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'content_shares_sharer_id_fkey';
            columns: ['sharer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      contents: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          item_url: string | null;
          media_type: string;
          release_date: string | null;
          title: string;
          title_embedding: string | null;
          title_kana: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          item_url?: string | null;
          media_type: string;
          release_date?: string | null;
          title: string;
          title_embedding?: string | null;
          title_kana?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          item_url?: string | null;
          media_type?: string;
          release_date?: string | null;
          title?: string;
          title_embedding?: string | null;
          title_kana?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      games: {
        Row: {
          hardware: string | null;
          id: string;
          item_price: number | null;
          jan: string | null;
          label: string | null;
          maker_code: string | null;
          rakuten_genre_id: string | null;
          review_average: number | null;
          review_count: number | null;
        };
        Insert: {
          hardware?: string | null;
          id: string;
          item_price?: number | null;
          jan?: string | null;
          label?: string | null;
          maker_code?: string | null;
          rakuten_genre_id?: string | null;
          review_average?: number | null;
          review_count?: number | null;
        };
        Update: {
          hardware?: string | null;
          id?: string;
          item_price?: number | null;
          jan?: string | null;
          label?: string | null;
          maker_code?: string | null;
          rakuten_genre_id?: string | null;
          review_average?: number | null;
          review_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'games_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'contents';
            referencedColumns: ['id'];
          },
        ];
      };
      list_shares: {
        Row: {
          created_at: string;
          id: string;
          list_id: string;
          recipient_id: string;
          sharer_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          list_id: string;
          recipient_id: string;
          sharer_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          list_id?: string;
          recipient_id?: string;
          sharer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'list_shares_list_id_fkey';
            columns: ['list_id'];
            isOneToOne: false;
            referencedRelation: 'content_lists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'list_shares_recipient_id_fkey';
            columns: ['recipient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'list_shares_sharer_id_fkey';
            columns: ['sharer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          search_media_types: string[];
          settings_completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          search_media_types?: string[];
          settings_completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          search_media_types?: string[];
          settings_completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_contents: {
        Row: {
          content_id: string;
          created_at: string;
          current_volume: number | null;
          id: string;
          is_ebook: boolean;
          is_sold: boolean;
          memo: string | null;
          rating: number | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content_id: string;
          created_at?: string;
          current_volume?: number | null;
          id?: string;
          is_ebook?: boolean;
          is_sold?: boolean;
          memo?: string | null;
          rating?: number | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content_id?: string;
          created_at?: string;
          current_volume?: number | null;
          id?: string;
          is_ebook?: boolean;
          is_sold?: boolean;
          memo?: string | null;
          rating?: number | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_contents_content_id_fkey';
            columns: ['content_id'];
            isOneToOne: false;
            referencedRelation: 'contents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_contents_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      video_sources: {
        Row: {
          episodes: number | null;
          fetched_at: string;
          format: string | null;
          id: string;
          name: string;
          price: number | null;
          region: string | null;
          seasons: number | null;
          source_id: number | null;
          type: string;
          video_id: string;
          web_url: string | null;
        };
        Insert: {
          episodes?: number | null;
          fetched_at?: string;
          format?: string | null;
          id?: string;
          name: string;
          price?: number | null;
          region?: string | null;
          seasons?: number | null;
          source_id?: number | null;
          type: string;
          video_id: string;
          web_url?: string | null;
        };
        Update: {
          episodes?: number | null;
          fetched_at?: string;
          format?: string | null;
          id?: string;
          name?: string;
          price?: number | null;
          region?: string | null;
          seasons?: number | null;
          source_id?: number | null;
          type?: string;
          video_id?: string;
          web_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'video_sources_video_id_fkey';
            columns: ['video_id'];
            isOneToOne: false;
            referencedRelation: 'videos';
            referencedColumns: ['id'];
          },
        ];
      };
      videos: {
        Row: {
          backdrop_path: string | null;
          genres: Json | null;
          id: string;
          imdb_id: string | null;
          media_type: string;
          number_of_episodes: number | null;
          number_of_seasons: number | null;
          original_title: string | null;
          poster_path: string | null;
          runtime: number | null;
          status: string | null;
          tmdb_id: number;
          vote_average: number | null;
          vote_count: number | null;
          watchmode_id: number | null;
        };
        Insert: {
          backdrop_path?: string | null;
          genres?: Json | null;
          id: string;
          imdb_id?: string | null;
          media_type: string;
          number_of_episodes?: number | null;
          number_of_seasons?: number | null;
          original_title?: string | null;
          poster_path?: string | null;
          runtime?: number | null;
          status?: string | null;
          tmdb_id: number;
          vote_average?: number | null;
          vote_count?: number | null;
          watchmode_id?: number | null;
        };
        Update: {
          backdrop_path?: string | null;
          genres?: Json | null;
          id?: string;
          imdb_id?: string | null;
          media_type?: string;
          number_of_episodes?: number | null;
          number_of_seasons?: number | null;
          original_title?: string | null;
          poster_path?: string | null;
          runtime?: number | null;
          status?: string | null;
          tmdb_id?: number;
          vote_average?: number | null;
          vote_count?: number | null;
          watchmode_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'videos_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'contents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'videos_id_media_type_fkey';
            columns: ['id', 'media_type'];
            isOneToOne: false;
            referencedRelation: 'contents';
            referencedColumns: ['id', 'media_type'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      find_user_id_by_email: { Args: { target_email: string }; Returns: string };
      match_contents: {
        Args: {
          match_count?: number;
          match_threshold?: number;
          query_embedding: string;
        };
        Returns: {
          description: string;
          id: string;
          image_url: string;
          item_url: string;
          media_type: string;
          release_date: string;
          similarity: number;
          title: string;
          title_kana: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
