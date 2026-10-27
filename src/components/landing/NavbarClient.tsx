"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { User, LogOut, ChevronDown, ArrowRight, LayoutDashboard, FileText, Search, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { CVBuilderLogo3D } from "@/components/ui/CVBuilderLogo3D";
import { cn } from "@/lib/utils";

interface NavLinkItem {
  href: string;
  label: string;
  flipLabel: string;
}

const PUBLIC_NAV_LINKS: NavLinkItem[] = [
  { href: "#cara-kerja", label: "Cara Kerja", flipLabel: "Cara Kerja" },
  { href: "#fitur", label: "Fitur Utama", flipLabel: "Fitur Utama" },
  { href: "#harga", label: "Biaya", flipLabel: "Biaya" },
  { href: "/lowongan", label: "Lowongan", flipLabel: "Lowongan" },
  { href: "#faq", label: "FAQ", flipLabel: "FAQ" },
];

const AUTH_NAV_LINKS: NavLinkItem[] = [
  { href: "/dashboard", label: "Dashboard", flipLabel: "Dashboard" },
  { href: "/cv/new", label: "Buat CV", flipLabel: "Buat CV" },
  { href: "/lowongan", label: "Cari Lowongan", flipLabel: "Cari Lowongan" },
  { href: "/tracker", label: "Pelacak Lamaran", flipLabel: "Pelacak Lamaran" },
];

interface NavbarClientProps {
  initialUser?: {
    id: string;
    email: string;
    fullName?: string | null;
    avatarUrl?: string | null;
    role?: string;
  } | null;
}

export function NavbarClient({ initialUser }: NavbarClientProps) {
  const pathname = usePathname();
  const [user] = React.useState(initialUser || null);

  // Scroll tracking states
  const [isScrolledPast80, setIsScrolledPast80] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);

  // Active hover link for 3D flip & layoutId indicator
  const [hoveredLink, setHoveredLink] = React.useState<string | null>(null);

  // Mobile menu state
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const mobileMenuRef = React.useRef<HTMLDivElement>(null);
  const firstFocusableRef = React.useRef<HTMLButtonElement>(null);

  // User dropdown menu state
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  // Scroll listener for sticky shrink and hide/show
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolledPast80(currentScrollY > 80);

      // Stable hide/show threshold to avoid flutter during scrubbing
      const delta = currentScrollY - lastScrollY.current;
      if (currentScrollY <= 80) {
        setIsVisible(true);
      } else if (Math.abs(delta) > 20) {
        if (delta > 0 && currentScrollY > 180) {
          setIsVisible(false); // Definite scroll down
        } else if (delta < 0) {
          setIsVisible(true); // Definite scroll up
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll and trap focus when mobile menu is open
  React.useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
      firstFocusableRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsMobileOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isMobileOpen]);

  const navLinks = user ? AUTH_NAV_LINKS : PUBLIC_NAV_LINKS;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-200 ease-out bg-transparent",
          isVisible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-2">
          <nav
            className={cn(
              "w-full text-[var(--text)] border-[3px] border-black rounded-[3px] transition-all duration-200 flex items-center justify-between px-4 sm:px-6",
              "bg-white/80 backdrop-blur-md",
              isScrolledPast80
                ? "py-2 shadow-[6px_6px_0_0_#000000] bg-white/90"
                : "py-3 shadow-[4px_4px_0_0_#000000]"
            )}
            aria-label="Navigasi Utama"
          >
            {/* Logo: 3D Animated CVBuilder */}
            <Link
              href={user ? "/dashboard" : "/"}
              className="flex items-center select-none"
              aria-label="CVBuilder Beranda"
            >
              <CVBuilderLogo3D size="md" />
            </Link>

            {/* Desktop Center Links with 3D Flip & Sliding Indicator */}
            <ul className="hidden lg:flex items-center gap-0.5 xl:gap-1 relative list-none m-0 p-0">
              {navLinks.map((item) => {
                const isHovered = hoveredLink === item.href;
                const isActive = pathname === item.href;

                return (
                  <li
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => setHoveredLink(item.href)}
                    onMouseLeave={() => setHoveredLink(null)}
                  >
                    {/* Active/Hover Background Pill */}
                    {isHovered && (
                      <motion.div
                        layoutId="navbar-hover-pill"
                        className="absolute inset-0 bg-[var(--accent)] border-2 border-black rounded-[2px] shadow-[2px_2px_0_0_#000000]"
                        transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      />
                    )}

                    <a
                      href={item.href}
                      onClick={(e) => {
                        if (item.href.startsWith("#")) {
                          e.preventDefault();
                          const target = document.querySelector(item.href);
                          if (target) {
                            const top = target.getBoundingClientRect().top + window.scrollY - 75;
                            window.scrollTo({ top, behavior: "smooth" });
                          }
                        }
                      }}
                      className={cn(
                        "relative z-10 px-2.5 xl:px-3.5 py-1.5 block text-[11px] xl:text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-body)] perspective-[500px]",
                        isActive ? "text-black" : "text-black"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {/* 3D Flip Container with fixed height */}
                      <span
                        className="block relative h-4 leading-4 transition-transform duration-200 ease-out"
                        style={{
                          transformStyle: "preserve-3d",
                          transform: isHovered ? "rotateX(-90deg)" : "rotateX(0deg)",
                        }}
                      >
                        {/* Front Face: translateZ(8px) with backface hidden */}
                        <span
                          className="block h-4 leading-4 text-black select-none whitespace-nowrap"
                          style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            transform: "translateZ(8px)",
                          }}
                        >
                          {item.label}
                        </span>

                        {/* Bottom Face: rotateX(90deg) translateZ(8px) with backface hidden */}
                        <span
                          className="absolute inset-0 block h-4 leading-4 text-black select-none whitespace-nowrap font-black"
                          style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            transform: "rotateX(90deg) translateZ(8px)",
                          }}
                        >
                          {item.label}
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>

            {/* Right CTAs / User Profile */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {user ? (
                /* Authenticated User Menu */
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)] text-black border-2 border-black rounded-[3px] text-xs font-bold font-[family-name:var(--font-mono)] hard-drop-sm focus:outline-none"
                    aria-expanded={isUserMenuOpen}
                    aria-label="Menu Pengguna"
                  >
                    <div className="h-5 w-5 bg-black text-white rounded-full flex items-center justify-center text-[10px]">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline-block max-w-[100px] truncate">
                      {user.fullName || user.email.split("@")[0]}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 mt-2 w-52 bg-[var(--surface)] border-[3px] border-black rounded-[3px] shadow-[4px_4px_0_0_#000000] p-1.5 z-50 flex flex-col gap-1 font-[family-name:var(--font-body)]"
                      >
                        <div className="px-3 py-2 border-b-2 border-black mb-1 bg-neutral-100">
                          <p className="text-[10px] font-bold text-neutral-600 font-[family-name:var(--font-mono)] uppercase">
                            Masuk sebagai
                          </p>
                          <p className="text-xs font-bold truncate text-black">{user.email}</p>
                          {user.role === "admin" && (
                            <span className="inline-block mt-1 text-[9px] bg-[var(--accent-2)] text-black font-extrabold px-1.5 py-0.2 border border-black uppercase">
                              Admin
                            </span>
                          )}
                        </div>

                        <Link
                          href="/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-black hover:bg-[var(--accent)] rounded-[2px] transition-colors"
                        >
                          <LayoutDashboard className="h-3.5 w-3.5 stroke-[2.5]" />
                          <span>Dasbor CV</span>
                        </Link>
                        <Link
                          href="/tracker"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-black hover:bg-[var(--accent)] rounded-[2px] transition-colors"
                        >
                          <Table2 className="h-3.5 w-3.5 stroke-[2.5]" />
                          <span>Pelacak Lamaran</span>
                        </Link>
                        <Link
                          href="/lowongan"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-black hover:bg-[var(--accent)] rounded-[2px] transition-colors"
                        >
                          <Search className="h-3.5 w-3.5 stroke-[2.5]" />
                          <span>Cari Lowongan</span>
                        </Link>

                        {user.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-black bg-[var(--accent-2)]/30 hover:bg-[var(--accent-2)] border border-black rounded-[2px] transition-colors"
                          >
                            <span>Panel Admin</span>
                          </Link>
                        )}

                        <div className="border-t-2 border-black pt-1 mt-1">
                          <form action="/auth/signout" method="POST">
                            <button
                              type="submit"
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[var(--status-error)] hover:bg-red-50 rounded-[2px] transition-colors text-left"
                            >
                              <LogOut className="h-3.5 w-3.5 stroke-[2.5]" />
                              <span>Keluar</span>
                            </button>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* Unauthenticated CTAs with Clear UI/UX Hierarchy */
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                  {/* Secondary Action: Clean link for existing returning users */}
                  <Link
                    href="/auth/login"
                    className="hidden sm:inline-flex items-center px-2.5 py-1 text-xs font-bold font-[family-name:var(--font-mono)] uppercase tracking-wider text-neutral-800 hover:text-black hover:underline transition-all"
                  >
                    Masuk
                  </Link>

                  {/* Primary CTA: High-contrast action to directly start creating CV */}
                  <Link href="/auth/login?next=/cv/new">
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs font-extrabold px-3 sm:px-4 py-1.5 flex items-center gap-1.5 hard-drop-sm whitespace-nowrap"
                    >
                      <span className="hidden sm:inline">Mulai Buat CV</span>
                      <span className="sm:hidden">Buat CV</span>
                      <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile / Tablet Hamburger Toggle Button */}
              <button
                ref={firstFocusableRef}
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden flex flex-col justify-center items-center w-9 h-9 border-2 border-black bg-[var(--surface)] rounded-[2px] hard-drop-sm focus:outline-none shrink-0"
                aria-label={isMobileOpen ? "Tutup Menu" : "Buka Menu"}
                aria-expanded={isMobileOpen}
              >
                <span
                  className={cn(
                    "w-5 h-0.5 bg-black transition-all duration-200",
                    isMobileOpen && "rotate-45 translate-y-1.5"
                  )}
                />
                <span
                  className={cn(
                    "w-5 h-0.5 bg-black my-1 transition-all duration-200",
                    isMobileOpen && "opacity-0"
                  )}
                />
                <span
                  className={cn(
                    "w-5 h-0.5 bg-black transition-all duration-200",
                    isMobileOpen && "-rotate-45 -translate-y-1.5"
                  )}
                />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Full-Screen Mobile/Tablet Menu with Staggered Entrance */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-[var(--bg)] pt-24 pb-8 px-6 flex flex-col justify-between lg:hidden border-b-[4px] border-black overflow-y-auto"
          >
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-mono)] text-neutral-600 border-b-2 border-black pb-2">
                Daftar Menu Navigasi
              </p>
              <ul className="space-y-3 list-none p-0 m-0">
                {navLinks.map((item, idx) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.15 }}
                  >
                    <a
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className="flex items-center justify-between p-3 bg-[var(--surface)] border-[2.5px] border-black rounded-[3px] shadow-[3px_3px_0_0_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    >
                      <span className="font-extrabold text-base font-[family-name:var(--font-display)] text-black">
                        {item.label}
                      </span>
                      <span className="font-[family-name:var(--font-mono)] font-bold text-xs bg-[var(--accent)] px-2 py-0.5 border border-black">
                        0{idx + 1}
                      </span>
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="pt-6 border-t-2 border-black mt-8 space-y-3">
              {!user ? (
                <div className="flex flex-col gap-2.5">
                  <Link href="/auth/login?next=/cv/new" onClick={() => setIsMobileOpen(false)}>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full hard-drop flex items-center justify-center gap-2 font-extrabold text-sm py-3"
                    >
                      <span>Mulai Buat CV Sekarang</span>
                      <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                    </Button>
                  </Link>
                  <Link href="/auth/login" onClick={() => setIsMobileOpen(false)}>
                    <Button
                      variant="outline"
                      size="md"
                      className="w-full text-xs font-bold py-2.5 border-2"
                    >
                      Sudah Punya Akun? Masuk
                    </Button>
                  </Link>
                </div>
              ) : (
                <form action="/auth/signout" method="POST">
                  <Button variant="dark" size="md" className="w-full flex items-center justify-center gap-2">
                    <LogOut className="h-4 w-4 stroke-[2.5]" />
                    <span>Keluar dari Akun</span>
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
