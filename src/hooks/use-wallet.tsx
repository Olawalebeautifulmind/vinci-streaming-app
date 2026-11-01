import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import type { Profile } from "@/lib/data";

type Ctx = {
  balance: number | null;
  lastClaimAt: string | null;
  profile: Profile | null;
  refresh: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const WalletCtx = createContext<Ctx>({
  balance: null,
  lastClaimAt: null,
  profile: null,
  refresh: async () => {},
  refreshProfile: async () => {},
});

/** The signed-in member's live Cowrie balance and profile. */
export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [lastClaimAt, setLastClaimAt] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("wallets")
      .select("balance, last_claim_at")
      .eq("user_id", user.id)
      .maybeSingle();
    setBalance(data?.balance ?? 0);
    setLastClaimAt(data?.last_claim_at ?? null);
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setProfile(data);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setBalance(null);
      setProfile(null);
      return;
    }
    void refresh();
    void refreshProfile();
    const ch = supabase
      .channel(`wallet:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${user.id}` },
        (p) => {
          const row = p.new as { balance?: number; last_claim_at?: string | null };
          if (typeof row.balance === "number") setBalance(row.balance);
          if (row.last_claim_at !== undefined) setLastClaimAt(row.last_claim_at);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [user, refresh, refreshProfile]);

  return (
    <WalletCtx.Provider value={{ balance, lastClaimAt, profile, refresh, refreshProfile }}>
      {children}
    </WalletCtx.Provider>
  );
}

export const useWallet = () => useContext(WalletCtx);
