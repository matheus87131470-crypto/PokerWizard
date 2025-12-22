import { BarChart3 } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              <span className="font-bold text-xl text-foreground">PokerStats</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Análise profissional de poker para jogadores sérios.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Produto</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="text-sm text-muted-foreground hover-elevate px-2 py-1 -ml-2 rounded-md inline-block">
                  Recursos
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-muted-foreground hover-elevate px-2 py-1 -ml-2 rounded-md inline-block">
                  Preços
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-muted-foreground hover-elevate px-2 py-1 -ml-2 rounded-md inline-block">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Suporte</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-sm text-muted-foreground hover-elevate px-2 py-1 -ml-2 rounded-md inline-block">
                  Central de Ajuda
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover-elevate px-2 py-1 -ml-2 rounded-md inline-block">
                  Contato
                </Link>
              </li>
              <li>
                <Link href="/tutorials" className="text-sm text-muted-foreground hover-elevate px-2 py-1 -ml-2 rounded-md inline-block">
                  Tutoriais
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover-elevate px-2 py-1 -ml-2 rounded-md inline-block">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover-elevate px-2 py-1 -ml-2 rounded-md inline-block">
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 PokerStats. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
