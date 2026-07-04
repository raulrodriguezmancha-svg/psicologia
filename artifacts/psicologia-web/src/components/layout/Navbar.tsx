import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Inicio" },
    { href: "/sobre-mi", label: "Sobre mí" },
    { href: "/servicios", label: "Servicios" },
    { href: "/resenas", label: "Reseñas" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6 flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Alba García Santillana - Psicóloga"
            className="h-14 w-auto object-contain"
          />
          <span className="font-serif text-xl md:text-2xl font-medium tracking-tight text-primary">
            Alba García Santillana
          </span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === link.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/reservar">
            <Button variant="default" className="rounded-full px-6">
              Reservar sesión
            </Button>
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-background border-b shadow-lg py-4 px-6 flex flex-col gap-4 animate-in slide-in-from-top-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-base font-medium transition-colors ${
                location === link.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/reservar" onClick={() => setIsMobileMenuOpen(false)}>
            <Button className="w-full mt-2 rounded-full">Reservar sesión</Button>
          </Link>
        </div>
      )}
    </header>
  );
}
