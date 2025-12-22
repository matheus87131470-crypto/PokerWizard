import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, BarChart3, Sparkles } from "lucide-react";
import { Link } from "wouter";

interface HeaderProps {
  freeAnalysesRemaining?: number;
  isPremium?: boolean;
  showCredits?: boolean;
}

export default function Header({ freeAnalysesRemaining = 5, isPremium = false, showCredits = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 hover-elevate rounded-lg px-2 -ml-2" data-testid="link-home">
            <BarChart3 className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl text-foreground">PokerStats</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-nav-home">
              Início
            </Link>
            <Link href="/dashboard" className="text-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-nav-dashboard">
              Dashboard
            </Link>
            <Link href="/upload" className="text-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-nav-upload">
              Análise
            </Link>
            <Link href="/pricing" className="text-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-nav-pricing">
              Planos
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {showCredits && !isPremium && (
              <Badge variant="secondary" className="gap-2" data-testid="badge-credits">
                <Sparkles className="w-4 h-4" />
                <span>{freeAnalysesRemaining}/5 análises</span>
              </Badge>
            )}

            {showCredits && isPremium && (
              <Badge className="gap-2 bg-primary text-primary-foreground" data-testid="badge-premium">
                <Sparkles className="w-4 h-4" />
                <span>Premium</span>
              </Badge>
            )}

            {!isPremium && (
              <Button
                variant="default"
                className="hidden md:flex"
                data-testid="button-upgrade-premium"
              >
                Assinar Premium
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden py-4 space-y-2 border-t border-border">
            <Link href="/" className="block px-3 py-2 rounded-md hover-elevate text-foreground" data-testid="link-mobile-home">
              Início
            </Link>
            <Link href="/dashboard" className="block px-3 py-2 rounded-md hover-elevate text-foreground" data-testid="link-mobile-dashboard">
              Dashboard
            </Link>
            <Link href="/upload" className="block px-3 py-2 rounded-md hover-elevate text-foreground" data-testid="link-mobile-upload">
              Análise
            </Link>
            <Link href="/pricing" className="block px-3 py-2 rounded-md hover-elevate text-foreground" data-testid="link-mobile-pricing">
              Planos
            </Link>
            <Button className="w-full" data-testid="button-mobile-premium">
              Assinar Premium
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
