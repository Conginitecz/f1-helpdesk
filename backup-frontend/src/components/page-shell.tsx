"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icon";
export interface PageShellNavItem { label: string; href: string; icon: string; }
interface PageShellProps { brandHref: string; roleLabel: string; userBadge: string; navItems: PageShellNavItem[]; pathname: string; onLogout: () => void; children: ReactNode; }
export function PageShell({ brandHref, roleLabel, userBadge, navItems, pathname, onLogout, children }: PageShellProps) {
  const activeLabel = navItems.find((i) => i.href === pathname)?.label ?? "Console";
  return (
    <div className="min-h-screen bg-surface-base md:pl-[var(--f1-dock-width)] xl:pl-[var(--f1-sidebar-width)]">
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-[var(--f1-sidebar-width)] flex-col justify-between bg-dark-navy shadow-level-1 xl:flex">
        <div className="flex flex-col">
          <Link className="flex h-16 items-center gap-space-sm px-space-lg" href={brandHref}>
            <span className="grid size-8 place-items-center rounded-panel bg-primary-container"><Icon className="text-on-primary" name="bolt" size={20} /></span>
            <span className="flex flex-col">
              <span className="font-headline text-headline-sm font-bold tracking-tight text-on-primary">F1 HELP DESK</span>
              <span className="font-mono text-label-sm uppercase tracking-wider text-surface-variant">Enterprise Service Core</span>
            </span>
          </Link>
          <div className="px-space-md py-space-sm">
            <div className="flex items-center justify-between rounded-panel bg-dark-navy p-space-xs">
              <span className="flex items-center gap-space-xs px-space-xs py-space-xs"><Icon className="text-secondary-fixed" name="shield_person" size={16} /><span className="font-body text-label-sm text-inverse-on-surface">Context</span></span>
              <span className="rounded-control bg-tertiary px-space-xs py-0.5 font-mono text-data-mono-sm text-on-tertiary">{roleLabel}</span>
            </div>
          </div>
          <nav aria-label="Main navigation" className="mt-space-xs flex flex-col gap-1 px-space-sm">
            {navItems.map((item) => { const active = pathname === item.href; return (
              <Link key={item.label} aria-current={active ? "page" : undefined} href={item.href} className={"flex items-center gap-space-sm rounded-panel px-space-md py-2 font-body text-label-md transition-colors " + (active ? "bg-primary-container font-medium text-on-primary" : "text-surface-variant hover:bg-inverse-surface hover:text-on-primary")}><Icon name={item.icon} size={18} /><span>{item.label}</span></Link>);})}
          </nav>
        </div>
        <div className="flex flex-col gap-space-sm px-space-md pb-space-md">
          <button className="flex min-h-9 items-center justify-center gap-space-xs rounded-control border border-surface-variant bg-transparent font-body text-label-md font-medium text-inverse-on-surface transition-colors hover:bg-inverse-surface" onClick={onLogout} type="button"><Icon name="logout" size={16} />Log out</button>
          <p className="font-mono text-data-mono-sm text-surface-variant">F1 Dispatch Engine</p>
        </div>
      </aside>
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-[var(--f1-dock-width)] flex-col items-center gap-1 bg-dark-navy py-space-md md:flex xl:hidden">
        <Link className="mb-space-sm grid size-8 place-items-center rounded-panel bg-primary-container" href={brandHref}><Icon className="text-on-primary" name="bolt" size={20} /></Link>
        <nav aria-label="Main navigation" className="flex flex-col items-center gap-1">
          {navItems.map((item) => { const active = pathname === item.href; return (
            <Link key={item.label} aria-current={active ? "page" : undefined} href={item.href} title={item.label} className={"grid size-10 place-items-center rounded-panel transition-colors " + (active ? "bg-primary-container text-on-primary" : "text-surface-variant hover:bg-inverse-surface hover:text-on-primary")}><Icon name={item.icon} size={20} /><span className="sr-only">{item.label}</span></Link>);})}
        </nav>
      </aside>
      <header className="sticky top-0 z-40 flex h-[var(--f1-header-height)] items-center justify-between gap-space-md border-b border-border-subtle bg-surface-card px-space-md md:px-space-lg">
        <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs">
          <Icon className="text-text-muted" name="home_repair_service" size={18} />
          <span className="font-body text-label-md text-text-muted">{roleLabel}</span>
          <Icon className="text-text-muted" name="chevron_right" size={16} />
          <span className="font-body text-label-md font-medium text-text-primary">{activeLabel}</span>
        </nav>
        <div className="flex items-center gap-space-sm">
          <span className="hidden items-center gap-space-xs rounded-panel bg-surface-base px-space-sm py-1 md:flex">
            <span className="font-body text-label-sm uppercase text-text-muted">Signed in</span>
            <span className="font-body text-label-sm font-semibold text-text-primary">{userBadge}</span>
          </span>
          <span className="grid size-8 place-items-center rounded-pill bg-primary"><Icon className="text-on-primary" name="person" size={18} /></span>
        </div>
      </header>
      <main className="min-w-0 px-space-md py-space-lg sm:px-space-lg">{children}</main>
      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-panel border-t border-border-subtle bg-surface-card pb-[env(safe-area-inset-bottom)] shadow-level-3 md:hidden">
        <div className="flex">
          {navItems.map((item) => { const active = pathname === item.href; return (
            <Link key={item.label} aria-current={active ? "page" : undefined} href={item.href} className={"flex min-h-[var(--f1-mobile-bar-height)] flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-2 font-body text-label-sm transition-colors " + (active ? "text-primary" : "text-text-muted")}><Icon name={item.icon} size={20} /><span className="max-w-full truncate px-0.5 text-center leading-none">{item.label}</span></Link>);})}
        </div>
        <div className="border-t border-border-subtle p-space-xs">
          <button className="flex min-h-9 w-full items-center justify-center gap-space-xs rounded-control border border-border-subtle bg-transparent font-body text-label-md font-medium text-text-primary transition-colors hover:bg-surface-base" onClick={onLogout} type="button"><Icon name="logout" size={16} />Log out</button>
        </div>
      </nav>
      <div aria-hidden="true" className="h-[calc(var(--f1-mobile-bar-height)+56px)] md:hidden" />
    </div>
  );
}
