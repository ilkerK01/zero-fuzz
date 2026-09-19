import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-32 text-center">
      <p className="mono text-sm text-danger">404 · not found</p>
      <h1 className="font-display mt-4 text-4xl text-fg">This page never existed.</h1>
      <p className="mt-3 max-w-sm text-fg-2">
        The route you asked for is not part of Z-FUZZ. Head back and start a scan instead.
      </p>
      <Link
        href="/"
        className="mt-8 bg-agent px-5 py-2.5 text-sm font-medium text-inset hover:brightness-110"
      >
        Back to home
      </Link>
    </main>
  );
}
