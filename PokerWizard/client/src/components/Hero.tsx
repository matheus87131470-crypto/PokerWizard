import { Button } from "@/components/ui/button";
import heroImage from "@assets/generated_images/Poker_analytics_dashboard_hero_e995af4f.png";
import { TrendingUp, BarChart3 } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Dashboard de análise de poker"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-primary" />
            <span className="text-primary font-semibold">Análise Profissional</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Domine Suas Sessões de Poker
          </h1>
          
          <p className="text-xl text-gray-200 mb-8">
            Analise gráficos detalhados das suas partidas, identifique padrões e melhore seu jogo. 
            Comece com 5 análises gratuitas.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground border border-primary-border hover-elevate active-elevate-2"
              data-testid="button-start-free"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Começar Grátis
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="backdrop-blur-sm bg-white/10 text-white border-white/20 hover-elevate active-elevate-2"
              data-testid="button-see-plans"
            >
              Ver Planos
            </Button>
          </div>

          <div className="mt-8 flex items-center gap-6 text-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-sm">5 análises gratuitas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-sm">Sem cartão de crédito</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
