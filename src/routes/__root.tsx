import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { WalletProvider, useWallet } from "@/hooks/use-wallet";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display text-primary">404</h1>
        <h2 className="mt-4 text-xl font-display text-foreground">Lost in the studio</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn't exist. Maybe the artist took it down.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-accent transition-colors"
          >
            Back to Vinci
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-display text-foreground">Something cracked the canvas</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or head home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-accent"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border border-border px-4 py-2 text-sm">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Vinci — Live Streams from Handmade Artists" },
      {
        name: "description",
        content:
          "Vinci is a global, live streaming platform for handmade creators. Watch bead makers and potters work live, bid on originals, gift Cowries and collect certified pieces.",
      },
      { name: "author", content: "Vinci" },
      { property: "og:title", content: "Vinci — Live Streams from Handmade Artists" },
      {
        property: "og:description",
        content:
          "Vinci is a global, live streaming platform for handmade creators. Watch bead makers and potters work live, bid on originals, gift Cowries and collect certified pieces.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Vinci — Live Streams from Handmade Artists" },
      {
        name: "twitter:description",
        content:
          "Vinci is a global, live streaming platform for handmade creators. Watch bead makers and potters work live, bid on originals, gift Cowries and collect certified pieces.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-sm bg-primary text-primary-foreground font-display text-lg font-bold">
            V
          </span>
          <span className="font-display text-xl tracking-tight">Vinci</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Live
          </Link>
          <Link
            to="/c/$slug"
            params={{ slug: "bead-making" }}
            className="hover:text-foreground transition-colors"
          >
            Bead Making
          </Link>
          <Link
            to="/c/$slug"
            params={{ slug: "pottery" }}
            className="hover:text-foreground transition-colors"
          >
            Pottery
          </Link>
          <Link to="/versus" className="hover:text-foreground transition-colors">
            Versus
          </Link>
          <Link to="/gallery" className="hover:text-foreground transition-colors">
            Gallery
          </Link>
          <Link to="/registry" className="hover:text-foreground transition-colors">
            Registry
          </Link>
          <Link to="/global" className="hover:text-foreground transition-colors">
            Global
          </Link>
        </nav>

        <HeaderAuth />
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="mx-auto max-w-7xl px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-sm bg-primary text-primary-foreground font-display font-bold">
              V
            </span>
            <span className="font-display text-lg">Vinci</span>
          </div>
          <p className="mt-3 max-w-xs text-muted-foreground">
            A global live stage for handmade artists. Watch, bid, collect, with a Vinci certificate
            for every piece. Live now for Bead Making and Pottery.
          </p>
        </div>
        <div>
          <p className="font-display text-foreground mb-3">Platform</p>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link to="/" className="hover:text-foreground">
                Live streams
              </Link>
            </li>
            <li>
              <Link to="/registry" className="hover:text-foreground">
                Registry
              </Link>
            </li>
            <li>
              <Link to="/versus" className="hover:text-foreground">
                Versus
              </Link>
            </li>
            <li>
              <Link to="/gallery" className="hover:text-foreground">
                Galleries
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-display text-foreground mb-3">Studio</p>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link to="/live/new" className="hover:text-foreground">
                Go live
              </Link>
            </li>
            <li>
              <Link to="/profile" className="hover:text-foreground">
                Your studio
              </Link>
            </li>
            <li>
              <Link to="/cowrie" className="hover:text-foreground">
                How Cowries work
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © 2026 Vinci. Made for makers.
      </div>
    </footer>
  );
}

function HeaderAuth() {
  const { user, loading, signOut } = useAuth();
  if (loading) {
    return <div className="h-9 w-24 rounded-md bg-card animate-pulse" />;
  }
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/live/new"
          className="hidden sm:inline-flex h-9 items-center rounded-md border border-primary/40 bg-primary/10 px-3 text-xs text-primary hover:bg-primary/20 transition-colors"
        >
          Go live
        </Link>
        <Link
          to="/auth"
          search={{ mode: "signin" }}
          className="hidden sm:inline-flex h-9 items-center rounded-md border border-border px-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in
        </Link>
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-accent transition-colors"
        >
          Sign up
        </Link>
      </div>
    );
  }
  return <SignedInHeader email={user.email ?? ""} signOut={signOut} />;
}

function SignedInHeader({ email, signOut }: { email: string; signOut: () => Promise<void> }) {
  const { balance, profile } = useWallet();
  const initial = (profile?.display_name || email || "?").charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <Link
        to="/cowrie"
        title="Your Cowries"
        className="inline-flex h-9 items-center rounded-md border border-border px-3 text-xs hover:border-primary/60"
      >
        🐚{" "}
        <span className="ml-1 font-display">
          {balance === null ? "…" : balance.toLocaleString()}
        </span>
      </Link>
      <Link
        to="/live/new"
        className="hidden sm:inline-flex h-9 items-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-accent transition-colors"
      >
        Go live
      </Link>
      <button
        onClick={signOut}
        title="Sign out"
        className="hidden sm:inline-flex h-9 items-center rounded-md border border-border px-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Sign out
      </button>
      <Link
        to="/profile"
        title="Your profile"
        className="grid h-9 w-9 place-items-center rounded-full bg-card border border-border text-xs font-display hover:border-primary/60 transition-colors"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          initial
        )}
      </Link>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WalletProvider>
          <div className="min-h-screen flex flex-col bg-background text-foreground">
            <SiteHeader />
            <main className="flex-1">
              <Outlet />
            </main>
            <SiteFooter />
          </div>
        </WalletProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
