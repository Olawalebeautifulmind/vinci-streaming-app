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
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
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
      auction_shipping: {
        Row: {
          bidder_id: string;
          shipping_address: string;
          work_id: string;
        };
        ComputedFields: never;
        Insert: {
          bidder_id: string;
          shipping_address: string;
          work_id: string;
        };
        Update: {
          bidder_id?: string;
          shipping_address?: string;
          work_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "auction_shipping_bidder_id_fkey";
            columns: ["bidder_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "auction_shipping_bidder_id_fkey";
            columns: ["bidder_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "auction_shipping_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "works";
            referencedColumns: ["id"];
          },
        ];
      };
      bids: {
        Row: {
          amount: number;
          bidder_id: string;
          created_at: string;
          id: number;
          work_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          bidder_id: string;
          created_at?: string;
          id?: never;
          work_id: string;
        };
        Update: {
          amount?: number;
          bidder_id?: string;
          created_at?: string;
          id?: never;
          work_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bids_bidder_id_fkey";
            columns: ["bidder_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bids_bidder_id_fkey";
            columns: ["bidder_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bids_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "works";
            referencedColumns: ["id"];
          },
        ];
      };
      certificates: {
        Row: {
          creator_id: string;
          edition_no: number;
          edition_size: number;
          fingerprint: string;
          id: string;
          issued_at: string;
          order_id: string;
          owner_id: string;
          price: number;
          serial: string;
          stream_id: string | null;
          work_id: string;
        };
        ComputedFields: never;
        Insert: {
          creator_id: string;
          edition_no: number;
          edition_size: number;
          fingerprint: string;
          id?: string;
          issued_at?: string;
          order_id: string;
          owner_id: string;
          price: number;
          serial: string;
          stream_id?: string | null;
          work_id: string;
        };
        Update: {
          creator_id?: string;
          edition_no?: number;
          edition_size?: number;
          fingerprint?: string;
          id?: string;
          issued_at?: string;
          order_id?: string;
          owner_id?: string;
          price?: number;
          serial?: string;
          stream_id?: string | null;
          work_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "certificates_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certificates_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certificates_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certificates_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certificates_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certificates_stream_id_fkey";
            columns: ["stream_id"];
            isOneToOne: false;
            referencedRelation: "streams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certificates_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "works";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_messages: {
        Row: {
          amount: number | null;
          body: string;
          created_at: string;
          id: number;
          kind: string;
          stream_id: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          amount?: number | null;
          body: string;
          created_at?: string;
          id?: never;
          kind?: string;
          stream_id: string;
          user_id?: string | null;
        };
        Update: {
          amount?: number | null;
          body?: string;
          created_at?: string;
          id?: never;
          kind?: string;
          stream_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_stream_id_fkey";
            columns: ["stream_id"];
            isOneToOne: false;
            referencedRelation: "streams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
        ];
      };
      commission_requests: {
        Row: {
          amount: number;
          created_at: string;
          creator_id: string;
          id: string;
          prompt: string;
          requester_id: string;
          resolved_at: string | null;
          status: string;
          stream_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          created_at?: string;
          creator_id: string;
          id?: string;
          prompt: string;
          requester_id: string;
          resolved_at?: string | null;
          status?: string;
          stream_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          creator_id?: string;
          id?: string;
          prompt?: string;
          requester_id?: string;
          resolved_at?: string | null;
          status?: string;
          stream_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "commission_requests_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commission_requests_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commission_requests_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commission_requests_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commission_requests_stream_id_fkey";
            columns: ["stream_id"];
            isOneToOne: false;
            referencedRelation: "streams";
            referencedColumns: ["id"];
          },
        ];
      };
      cowrie_ledger: {
        Row: {
          balance_after: number | null;
          created_at: string;
          delta: number;
          id: number;
          reason: string;
          ref_id: string | null;
          ref_type: string | null;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          balance_after?: number | null;
          created_at?: string;
          delta: number;
          id?: never;
          reason: string;
          ref_id?: string | null;
          ref_type?: string | null;
          user_id?: string | null;
        };
        Update: {
          balance_after?: number | null;
          created_at?: string;
          delta?: number;
          id?: never;
          reason?: string;
          ref_id?: string | null;
          ref_type?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      crafts: {
        Row: {
          enabled: boolean;
          name: string;
          slug: string;
          sort: number;
        };
        ComputedFields: never;
        Insert: {
          enabled?: boolean;
          name: string;
          slug: string;
          sort?: number;
        };
        Update: {
          enabled?: boolean;
          name?: string;
          slug?: string;
          sort?: number;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          created_at: string;
          creator_id: string;
          follower_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          creator_id: string;
          follower_id: string;
        };
        Update: {
          created_at?: string;
          creator_id?: string;
          follower_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
        ];
      };
      galleries: {
        Row: {
          craft: string;
          created_at: string;
          curator_id: string;
          ends_at: string;
          entry_fee: number;
          id: string;
          palette_a: string;
          palette_b: string;
          starts_at: string;
          theme: string | null;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          craft: string;
          created_at?: string;
          curator_id: string;
          ends_at?: string;
          entry_fee?: number;
          id?: string;
          palette_a?: string;
          palette_b?: string;
          starts_at?: string;
          theme?: string | null;
          title: string;
        };
        Update: {
          craft?: string;
          created_at?: string;
          curator_id?: string;
          ends_at?: string;
          entry_fee?: number;
          id?: string;
          palette_a?: string;
          palette_b?: string;
          starts_at?: string;
          theme?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "galleries_craft_fkey";
            columns: ["craft"];
            isOneToOne: false;
            referencedRelation: "crafts";
            referencedColumns: ["slug"];
          },
          {
            foreignKeyName: "galleries_curator_id_fkey";
            columns: ["curator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "galleries_curator_id_fkey";
            columns: ["curator_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
        ];
      };
      gallery_passes: {
        Row: {
          created_at: string;
          gallery_id: string;
          paid: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          gallery_id: string;
          paid?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          gallery_id?: string;
          paid?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gallery_passes_gallery_id_fkey";
            columns: ["gallery_id"];
            isOneToOne: false;
            referencedRelation: "galleries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gallery_passes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gallery_passes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
        ];
      };
      gallery_rsvps: {
        Row: {
          created_at: string;
          gallery_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          gallery_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          gallery_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gallery_rsvps_gallery_id_fkey";
            columns: ["gallery_id"];
            isOneToOne: false;
            referencedRelation: "galleries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gallery_rsvps_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gallery_rsvps_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
        ];
      };
      gallery_works: {
        Row: {
          created_at: string;
          gallery_id: string;
          work_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          gallery_id: string;
          work_id: string;
        };
        Update: {
          created_at?: string;
          gallery_id?: string;
          work_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gallery_works_gallery_id_fkey";
            columns: ["gallery_id"];
            isOneToOne: false;
            referencedRelation: "galleries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gallery_works_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "works";
            referencedColumns: ["id"];
          },
        ];
      };
      gifts: {
        Row: {
          amount: number;
          created_at: string;
          creator_id: string;
          creator_net: number;
          gift: string;
          id: number;
          sender_id: string;
          stream_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          created_at?: string;
          creator_id: string;
          creator_net: number;
          gift: string;
          id?: never;
          sender_id: string;
          stream_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          creator_id?: string;
          creator_net?: number;
          gift?: string;
          id?: never;
          sender_id?: string;
          stream_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gifts_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gifts_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gifts_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gifts_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gifts_stream_id_fkey";
            columns: ["stream_id"];
            isOneToOne: false;
            referencedRelation: "streams";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          buyer_id: string;
          created_at: string;
          edition_no: number;
          id: string;
          price: number;
          seller_id: string;
          shipping_address: string | null;
          source: string;
          status: string;
          tracking: string | null;
          work_id: string;
        };
        ComputedFields: never;
        Insert: {
          buyer_id: string;
          created_at?: string;
          edition_no: number;
          id?: string;
          price: number;
          seller_id: string;
          shipping_address?: string | null;
          source: string;
          status?: string;
          tracking?: string | null;
          work_id: string;
        };
        Update: {
          buyer_id?: string;
          created_at?: string;
          edition_no?: number;
          id?: string;
          price?: number;
          seller_id?: string;
          shipping_address?: string | null;
          source?: string;
          status?: string;
          tracking?: string | null;
          work_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "works";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_settings: {
        Row: {
          daily_claim: number;
          id: boolean;
          platform_fee_pct: number;
          real_money: boolean;
          starter_grant: number;
        };
        ComputedFields: never;
        Insert: {
          daily_claim?: number;
          id?: boolean;
          platform_fee_pct?: number;
          real_money?: boolean;
          starter_grant?: number;
        };
        Update: {
          daily_claim?: number;
          id?: boolean;
          platform_fee_pct?: number;
          real_money?: boolean;
          starter_grant?: number;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          image_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          city: string | null;
          country_code: string | null;
          crafts: string[];
          created_at: string;
          display_name: string | null;
          handle: string | null;
          id: string;
          is_creator: boolean;
          member_no: number;
          region: string | null;
          updated_at: string;
          verified: boolean;
          wallet_address: string | null;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          country_code?: string | null;
          crafts?: string[];
          created_at?: string;
          display_name?: string | null;
          handle?: string | null;
          id: string;
          is_creator?: boolean;
          member_no?: number;
          region?: string | null;
          updated_at?: string;
          verified?: boolean;
          wallet_address?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          country_code?: string | null;
          crafts?: string[];
          created_at?: string;
          display_name?: string | null;
          handle?: string | null;
          id?: string;
          is_creator?: boolean;
          member_no?: number;
          region?: string | null;
          updated_at?: string;
          verified?: boolean;
          wallet_address?: string | null;
        };
        Relationships: [];
      };
      stream_secrets: {
        Row: {
          created_at: string;
          rtmps_url: string | null;
          stream_id: string;
          stream_key: string | null;
          whip_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          rtmps_url?: string | null;
          stream_id: string;
          stream_key?: string | null;
          whip_url?: string | null;
        };
        Update: {
          created_at?: string;
          rtmps_url?: string | null;
          stream_id?: string;
          stream_key?: string | null;
          whip_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stream_secrets_stream_id_fkey";
            columns: ["stream_id"];
            isOneToOne: true;
            referencedRelation: "streams";
            referencedColumns: ["id"];
          },
        ];
      };
      streams: {
        Row: {
          auction_enabled: boolean;
          cf_live_input_id: string | null;
          cover_url: string | null;
          craft: string;
          created_at: string;
          creator_id: string;
          description: string | null;
          difficulty: string | null;
          discipline: string | null;
          ended_at: string | null;
          format: string;
          id: string;
          ingest: string;
          last_heartbeat_at: string | null;
          materials: string[];
          replay_video_id: string | null;
          started_at: string | null;
          status: string;
          tags: string[];
          tips_enabled: boolean;
          title: string;
          versus_enabled: boolean;
          whep_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          auction_enabled?: boolean;
          cf_live_input_id?: string | null;
          cover_url?: string | null;
          craft: string;
          created_at?: string;
          creator_id: string;
          description?: string | null;
          difficulty?: string | null;
          discipline?: string | null;
          ended_at?: string | null;
          format?: string;
          id?: string;
          ingest?: string;
          last_heartbeat_at?: string | null;
          materials?: string[];
          replay_video_id?: string | null;
          started_at?: string | null;
          status?: string;
          tags?: string[];
          tips_enabled?: boolean;
          title: string;
          versus_enabled?: boolean;
          whep_url?: string | null;
        };
        Update: {
          auction_enabled?: boolean;
          cf_live_input_id?: string | null;
          cover_url?: string | null;
          craft?: string;
          created_at?: string;
          creator_id?: string;
          description?: string | null;
          difficulty?: string | null;
          discipline?: string | null;
          ended_at?: string | null;
          format?: string;
          id?: string;
          ingest?: string;
          last_heartbeat_at?: string | null;
          materials?: string[];
          replay_video_id?: string | null;
          started_at?: string | null;
          status?: string;
          tags?: string[];
          tips_enabled?: boolean;
          title?: string;
          versus_enabled?: boolean;
          whep_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "streams_craft_fkey";
            columns: ["craft"];
            isOneToOne: false;
            referencedRelation: "crafts";
            referencedColumns: ["slug"];
          },
          {
            foreignKeyName: "streams_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "streams_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      versus_battles: {
        Row: {
          challenger_id: string;
          challenger_label: string | null;
          craft: string;
          created_at: string;
          duration_minutes: number;
          ends_at: string | null;
          id: string;
          opponent_id: string;
          opponent_label: string | null;
          payout_a: number | null;
          payout_b: number | null;
          pot: number;
          starts_at: string | null;
          status: string;
          title: string;
          vote_cost: number;
          votes_a: number;
          votes_b: number;
          winner_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          challenger_id: string;
          challenger_label?: string | null;
          craft: string;
          created_at?: string;
          duration_minutes?: number;
          ends_at?: string | null;
          id?: string;
          opponent_id: string;
          opponent_label?: string | null;
          payout_a?: number | null;
          payout_b?: number | null;
          pot?: number;
          starts_at?: string | null;
          status?: string;
          title: string;
          vote_cost?: number;
          votes_a?: number;
          votes_b?: number;
          winner_id?: string | null;
        };
        Update: {
          challenger_id?: string;
          challenger_label?: string | null;
          craft?: string;
          created_at?: string;
          duration_minutes?: number;
          ends_at?: string | null;
          id?: string;
          opponent_id?: string;
          opponent_label?: string | null;
          payout_a?: number | null;
          payout_b?: number | null;
          pot?: number;
          starts_at?: string | null;
          status?: string;
          title?: string;
          vote_cost?: number;
          votes_a?: number;
          votes_b?: number;
          winner_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "versus_battles_challenger_id_fkey";
            columns: ["challenger_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "versus_battles_challenger_id_fkey";
            columns: ["challenger_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "versus_battles_craft_fkey";
            columns: ["craft"];
            isOneToOne: false;
            referencedRelation: "crafts";
            referencedColumns: ["slug"];
          },
          {
            foreignKeyName: "versus_battles_opponent_id_fkey";
            columns: ["opponent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "versus_battles_opponent_id_fkey";
            columns: ["opponent_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "versus_battles_winner_id_fkey";
            columns: ["winner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "versus_battles_winner_id_fkey";
            columns: ["winner_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
        ];
      };
      versus_votes: {
        Row: {
          battle_id: string;
          created_at: string;
          side: string;
          voter_id: string;
        };
        ComputedFields: never;
        Insert: {
          battle_id: string;
          created_at?: string;
          side: string;
          voter_id: string;
        };
        Update: {
          battle_id?: string;
          created_at?: string;
          side?: string;
          voter_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "versus_votes_battle_id_fkey";
            columns: ["battle_id"];
            isOneToOne: false;
            referencedRelation: "versus_battles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "versus_votes_voter_id_fkey";
            columns: ["voter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "versus_votes_voter_id_fkey";
            columns: ["voter_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
        ];
      };
      wallets: {
        Row: {
          balance: number;
          last_claim_at: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          balance?: number;
          last_claim_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          balance?: number;
          last_claim_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      works: {
        Row: {
          auction_ends_at: string | null;
          auction_status: string | null;
          craft: string;
          created_at: string;
          creator_id: string;
          current_bid: number | null;
          delivery: string;
          description: string | null;
          edition_size: number;
          editions_sold: number;
          id: string;
          image_url: string | null;
          lead_time: string | null;
          medium: string | null;
          min_increment: number;
          price: number | null;
          sale_mode: string;
          ships_from: string | null;
          status: string;
          stream_id: string | null;
          title: string;
          top_bidder_id: string | null;
          year: number | null;
        };
        ComputedFields: never;
        Insert: {
          auction_ends_at?: string | null;
          auction_status?: string | null;
          craft: string;
          created_at?: string;
          creator_id: string;
          current_bid?: number | null;
          delivery?: string;
          description?: string | null;
          edition_size?: number;
          editions_sold?: number;
          id?: string;
          image_url?: string | null;
          lead_time?: string | null;
          medium?: string | null;
          min_increment?: number;
          price?: number | null;
          sale_mode?: string;
          ships_from?: string | null;
          status?: string;
          stream_id?: string | null;
          title: string;
          top_bidder_id?: string | null;
          year?: number | null;
        };
        Update: {
          auction_ends_at?: string | null;
          auction_status?: string | null;
          craft?: string;
          created_at?: string;
          creator_id?: string;
          current_bid?: number | null;
          delivery?: string;
          description?: string | null;
          edition_size?: number;
          editions_sold?: number;
          id?: string;
          image_url?: string | null;
          lead_time?: string | null;
          medium?: string | null;
          min_increment?: number;
          price?: number | null;
          sale_mode?: string;
          ships_from?: string | null;
          status?: string;
          stream_id?: string | null;
          title?: string;
          top_bidder_id?: string | null;
          year?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "works_craft_fkey";
            columns: ["craft"];
            isOneToOne: false;
            referencedRelation: "crafts";
            referencedColumns: ["slug"];
          },
          {
            foreignKeyName: "works_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "works_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "works_stream_id_fkey";
            columns: ["stream_id"];
            isOneToOne: false;
            referencedRelation: "streams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "works_top_bidder_id_fkey";
            columns: ["top_bidder_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "works_top_bidder_id_fkey";
            columns: ["top_bidder_id"];
            isOneToOne: false;
            referencedRelation: "versus_leaderboard";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      versus_leaderboard: {
        Row: {
          avatar_url: string | null;
          battles: number | null;
          city: string | null;
          country_code: string | null;
          cowries_earned: number | null;
          display_name: string | null;
          handle: string | null;
          id: string;
          votes_received_total: number | null;
          wins: number | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
    };
    Functions: {
      _assert_enabled_craft: { Args: { _craft: string }; Returns: undefined };
      _chat_event: {
        Args: { _amount: number; _body: string; _kind: string; _stream: string; _user: string };
        Returns: undefined;
      };
      _issue_sale: {
        Args: {
          _buyer: string;
          _price: number;
          _ship: string;
          _source: string;
          _w: Omit<
            Database["public"]["Tables"]["works"]["Row"],
            Database["public"]["Tables"]["works"]["ComputedFields"]
          >;
        };
        Returns: string;
      };
      _move_cowries: {
        Args: {
          _delta: number;
          _reason: string;
          _ref_id: string;
          _ref_type: string;
          _user: string;
        };
        Returns: number;
      };
      _pay_creator: {
        Args: {
          _creator: string;
          _gross: number;
          _reason: string;
          _ref_id: string;
          _ref_type: string;
        };
        Returns: number;
      };
      become_creator: { Args: { _crafts: string[] }; Returns: undefined };
      buy_work: { Args: { _shipping?: string; _work: string }; Returns: string };
      claim_daily_cowries: { Args: Record<PropertyKey, never>; Returns: number };
      close_auction: { Args: { _work: string }; Returns: string };
      close_expired_auctions: { Args: Record<PropertyKey, never>; Returns: number };
      create_battle: {
        Args: {
          _craft: string;
          _duration: number;
          _my_label?: string;
          _opponent_handle: string;
          _title: string;
        };
        Returns: string;
      };
      end_stale_streams: { Args: Record<PropertyKey, never>; Returns: number };
      enter_gallery: { Args: { _gallery: string }; Returns: undefined };
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user_id: string };
        Returns: boolean;
      };
      mark_order_delivered: { Args: { _order: string }; Returns: undefined };
      mark_order_shipped: { Args: { _order: string; _tracking: string }; Returns: undefined };
      place_bid: { Args: { _amount: number; _shipping?: string; _work: string }; Returns: number };
      resolve_commission: { Args: { _accept: boolean; _id: string }; Returns: undefined };
      respond_battle: {
        Args: { _accept: boolean; _id: string; _my_label?: string };
        Returns: undefined;
      };
      send_gift: { Args: { _gift: string; _stream: string }; Returns: number };
      settle_battle: { Args: { _id: string }; Returns: undefined };
      settle_expired_battles: { Args: Record<PropertyKey, never>; Returns: number };
      stream_heartbeat: { Args: { _stream: string }; Returns: undefined };
      submit_commission: {
        Args: { _amount: number; _prompt: string; _stream: string };
        Returns: string;
      };
      user_stats: {
        Args: { _user: string };
        Returns: {
          bids_placed: number;
          cowries_gifted: number;
          followers: number;
          minutes_streamed: number;
          streams_hosted: number;
          versus_wins: number;
          works_sold: number;
          xp: number;
        }[];
      };
      vote_battle: { Args: { _id: string; _side: string }; Returns: undefined };
    };
    Enums: {
      app_role: "viewer" | "creator" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
      app_role: ["viewer", "creator", "admin"],
    },
  },
} as const;
