'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/', label: 'Overview' },
  { href: '/generate', label: 'Studio' },
  { href: '/#features', label: 'Capabilities', targetId: 'features' },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const scrollToTarget = (targetId: string) => {
    const target = document.getElementById(targetId);
    const nav = document.querySelector('nav');

    if (!target) {
      return;
    }

    const navHeight = nav?.getBoundingClientRect().height ?? 0;
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: Math.max(0, targetTop - navHeight - 24),
      behavior: 'smooth',
    });
  };

  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, item: { href: string; label: string; targetId?: string }) => {
    if (!item.targetId || pathname !== '/') {
      return;
    }

    event.preventDefault();
    scrollToTarget(item.targetId);
  };

  const handleCapabilitiesClick = () => {
    if (pathname === '/') {
      scrollToTarget('features');
      return;
    }

    router.push('/');
    window.setTimeout(() => scrollToTarget('features'), 250);
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-2xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3" id="nav-logo">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-amber-50 shadow-sm transition-transform group-hover:-translate-y-0.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M8 12h8M8 16h8" />
              </svg>
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-slate-900">Draftly Studio</p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            {NAV_ITEMS.map((item) => (
              item.targetId ? (
                <button key={item.href} type="button" onClick={handleCapabilitiesClick} className="rounded-full px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                  {item.label}
                </button>
              ) : (
                <Link key={item.href} href={item.href} onClick={(event) => handleNavClick(event, item)} className="rounded-full px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                  {item.label}
                </Link>
              )
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="glass-chip rounded-full px-3 py-1.5 text-xs text-slate-500">Private generation</div>

            {status === 'loading' ? (
              <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse" />
            ) : session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 transition-colors hover:bg-slate-50"
                  id="nav-profile-btn"
                >
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                      width={28}
                      height={28}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                      {session.user.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="max-w-[140px] truncate text-sm text-slate-700">{session.user.name?.split(' ')[0]}</span>
                  <svg className={`h-3.5 w-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="border-b border-slate-200 px-4 py-4">
                        <p className="text-sm font-medium text-slate-900">{session.user.name}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{session.user.email}</p>
                      </div>
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                        id="nav-signout-btn"
                      >
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
                id="nav-signin-btn"
              >
                Sign in
              </button>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition-colors hover:bg-slate-50 lg:hidden"
            id="nav-mobile-toggle"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="pb-4 lg:hidden animate-in slide-in-from-top-2 duration-200">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
              <div className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  item.targetId ? (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        handleCapabilitiesClick();
                      }}
                      className="block w-full rounded-xl px-4 py-3 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(event) => {
                        setMobileOpen(false);
                        handleNavClick(event, item);
                      }}
                      className="block rounded-xl px-4 py-3 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      {item.label}
                    </Link>
                  )
                ))}
              </div>

              <div className="mt-3 border-t border-slate-200 pt-3">
                {session?.user ? (
                  <>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      {session.user.image ? (
                        <Image src={session.user.image} alt="" className="h-10 w-10 rounded-full object-cover" width={40} height={40} referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                          {session.user.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-900">{session.user.name}</p>
                        <p className="truncate text-xs text-slate-500">{session.user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => signIn('google')}
                    className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Sign in with Google
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
