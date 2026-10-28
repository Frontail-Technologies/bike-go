import Image from "next/image";
import Link from "next/link";
import { AdminPage } from "@/components/admin/layout";

export default function AdminNotFound() {
  return (
    <AdminPage>
      <section className="adminHero grid min-h-[calc(100dvh-9rem)] items-center gap-5 overflow-hidden rounded-3xl p-5 sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] lg:p-10">
        <div className="mx-auto max-w-lg text-center lg:mx-0 lg:text-left">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--admin-warning)]">404 · Admin route not found</p>
          <h1 className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">This workspace does not exist.</h1>
          <p className="mt-4 text-pretty text-sm leading-6 text-[var(--admin-muted)]">The admin link may be outdated or the module may have moved. Return to the dashboard or continue managing vehicles.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/admin" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--admin-accent)] px-5 text-sm font-extrabold text-[#111820] outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-[var(--admin-accent-strong)]/45 motion-reduce:transform-none motion-reduce:transition-none">Admin Dashboard</Link>
            <Link href="/admin/vehicles" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--admin-border-strong)] bg-white px-5 text-sm font-extrabold outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-[var(--admin-accent-strong)]/45 motion-reduce:transform-none motion-reduce:transition-none">View Vehicles</Link>
          </div>
        </div>
        <Image src="/illustrations/ridego-not-found.svg" width={720} height={520} priority alt="A RideGo scooter beside a winding road and an unknown destination marker" className="order-first mx-auto h-auto w-full max-w-[560px] lg:order-last" />
      </section>
    </AdminPage>
  );
}
