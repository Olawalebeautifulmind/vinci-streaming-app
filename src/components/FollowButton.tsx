import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRequireAuth } from "@/hooks/use-auth";

export function FollowButton({
  creatorId,
  className = "",
}: {
  creatorId: string;
  className?: string;
}) {
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { count: c } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", creatorId);
      setCount(c ?? 0);
      if (user) {
        const { data } = await supabase
          .from("follows")
          .select("creator_id")
          .eq("creator_id", creatorId)
          .eq("follower_id", user.id)
          .maybeSingle();
        setFollowing(!!data);
      }
    })();
  }, [creatorId, user]);

  if (user?.id === creatorId)
    return (
      <span className="text-xs text-muted-foreground self-center">{count ?? 0} followers</span>
    );

  const toggle = async () => {
    if (!requireAuth("follow this maker")) return;
    if (following) {
      await supabase
        .from("follows")
        .delete()
        .eq("creator_id", creatorId)
        .eq("follower_id", user!.id);
      setFollowing(false);
      setCount((c) => (c ?? 1) - 1);
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ creator_id: creatorId, follower_id: user!.id });
      if (!error) {
        setFollowing(true);
        setCount((c) => (c ?? 0) + 1);
      }
    }
  };

  return (
    <button
      onClick={toggle}
      className={`h-10 rounded-md px-5 text-sm transition ${following ? "border border-primary/60 text-primary" : "bg-primary text-primary-foreground hover:bg-accent"} ${className}`}
    >
      {following ? "Following" : "Follow"}{" "}
      {count !== null && <span className="ml-1 text-xs opacity-70">{count}</span>}
    </button>
  );
}
