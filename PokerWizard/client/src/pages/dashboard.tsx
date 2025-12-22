import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdPlaceholder from "@/components/AdPlaceholder";
import PremiumModal from "@/components/PremiumModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Trophy, Hash, Target, DollarSign, TrendingUp } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { UserCredits, Analysis } from "@shared/schema";

export default function Dashboard() {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { toast } = useToast();
  const [location] = useLocation();

  const { data: credits } = useQuery<UserCredits>({
    queryKey: ['/api/credits'],
  });

  const { data: analyses = [] } = useQuery<Analysis[]>({
    queryKey: ['/api/analyses'],
  });

  const watchAdMutation = useMutation({
    mutationFn: () => apiRequest('/api/credits/watch-ad', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credits'] });
      toast({
        title: "Crédito ganho!",
        description: "Você ganhou 1 análise grátis.",
      });
    },
  });

  // Handle Stripe checkout success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      fetch('/api/checkout-success')
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/credits'] });
          toast({
            title: "Premium Ativado!",
            description: "Agora você tem análises ilimitadas.",
          });
          // Clean URL
          window.history.replaceState({}, '', '/dashboard');
        })
        .catch(console.error);
    } else if (params.get('canceled') === 'true') {
      toast({
        title: "Pagamento Cancelado",
        description: "Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [toast]);

  const isPremium = credits?.isPremium ?? false;
  const freeAnalyses = credits?.freeAnalyses ?? 0;

  // Calculate aggregate stats from all analyses
  const totalHands = analyses.reduce((sum, a) => sum + a.handsPlayed, 0);
  const avgWinRate = analyses.length > 0
    ? (analyses.reduce((sum, a) => sum + parseFloat(a.winRate), 0) / analyses.length).toFixed(1)
    : '0.0';
  const avgVPIP = analyses.length > 0
    ? (analyses.reduce((sum, a) => sum + parseFloat(a.vpip), 0) / analyses.length).toFixed(1)
    : '0.0';
  const avgPFR = analyses.length > 0
    ? (analyses.reduce((sum, a) => sum + parseFloat(a.pfr), 0) / analyses.length).toFixed(1)
    : '0.0';

  // Chart data from real analyses
  const winrateData = analyses.slice(-6).map((analysis, index) => ({
    mes: new Date(analysis.createdAt!).toLocaleDateString('pt-BR', { month: 'short' }),
    winrate: parseFloat(analysis.winRate),
  }));

  const statsData = analyses.length > 0 ? [
    { stat: "VPIP", valor: parseFloat(avgVPIP) },
    { stat: "PFR", valor: parseFloat(avgPFR) },
    { stat: "3-Bet", valor: parseFloat(analyses[0]?.threeBet ?? '0') },
  ] : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header showCredits={true} freeAnalysesRemaining={freeAnalyses} isPremium={isPremium} />
      
      <main className="flex-1 bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Visão geral do seu desempenho</p>
            </div>
            <Button 
              variant="outline" 
              className="gap-2" 
              data-testid="button-export"
              onClick={() => toast({ title: "Em breve", description: "Exportação de relatórios em desenvolvimento" })}
            >
              <Download className="w-4 h-4" />
              Exportar Relatório
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Winrate Médio</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="stat-winrate">
                      {avgWinRate}%
                    </p>
                    {analyses.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-500">+2.3%</span>
                      </div>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Mãos Jogadas</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="stat-hands">
                      {totalHands.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">VPIP Médio</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="stat-vpip">
                      {avgVPIP}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Análises</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="stat-analyses">
                      {analyses.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          {winrateData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução do Winrate</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={winrateData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="mes" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="winrate"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        name="Winrate (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {statsData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Estatísticas de Jogo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statsData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="stat" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="valor" fill="hsl(var(--chart-2))" name="Porcentagem (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Análises Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyses.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        Nenhuma análise ainda. Faça upload do seu primeiro arquivo!
                      </p>
                      <Button className="mt-4" asChild>
                        <a href="/upload">Começar Análise</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analyses.slice(0, 5).map((analysis) => (
                        <div
                          key={analysis.id}
                          className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover-elevate"
                          data-testid={`analysis-${analysis.id}`}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{analysis.filename}</p>
                            <div className="flex items-center gap-4 mt-1 flex-wrap">
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(analysis.createdAt!).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {analysis.handsPlayed} mãos
                              </span>
                              <span className="text-sm font-medium text-foreground">
                                Winrate: {analysis.winRate}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {!isPremium && (
                <AdPlaceholder onWatchAd={() => watchAdMutation.mutate()} creditsEarned={1} />
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Dica do Dia</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {analyses.length > 0 && parseFloat(avgVPIP) > 25
                      ? "Seu VPIP está acima do ideal para jogos 6-max. Considere jogar mais tight nas posições iniciais."
                      : "Continue analisando suas sessões para receber dicas personalizadas!"}
                  </p>
                </CardContent>
              </Card>

              {!isPremium && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowPremiumModal(true)}
                  data-testid="button-upgrade"
                >
                  Fazer Upgrade para Premium
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      
      <PremiumModal open={showPremiumModal} onOpenChange={setShowPremiumModal} />
    </div>
  );
}
