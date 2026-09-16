import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-foreground text-center">
      <h1 className="text-4xl font-black text-rose-500">Access Denied</h1>
      <p className="mt-2 text-text-muted">You do not have administrative privileges to view this page.</p>
      <Link href="/" className="mt-6 rounded-xl bg-accent px-4 py-2 font-bold text-slate-950 hover:bg-yellow-300">
        Go Back Home
      </Link>
    </main>
  );
}