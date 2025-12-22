import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdPlaceholder from "@/components/AdPlaceholder";
import PremiumModal from "@/components/PremiumModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Upload as UploadIcon, File, X, Loader2 } from "lucide-react";
import type { UserCredits, Analysis } from "@shared/schema";

export default function Upload() {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const { data: credits, isLoading: creditsLoading } = useQuery<UserCredits>({
    queryKey: ['/api/credits'],
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

  const analyzeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao analisar arquivo');
      }
      
      return response.json();
    },
    onSuccess: (data: Analysis) => {
      queryClient.invalidateQueries({ queryKey: ['/api/credits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analyses'] });
      toast({
        title: "Análise concluída!",
        description: `${data.handsPlayed} mãos analisadas com sucesso.`,
      });
      setFiles([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na análise",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    if (files.length === 0) return;
    
    if (!credits?.isPremium && (credits?.freeAnalyses ?? 0) <= 0) {
      toast({
        title: "Sem créditos",
        description: "Assista um anúncio ou faça upgrade para Premium.",
        variant: "destructive",
      });
      return;
    }
    
    // Analyze first file for now
    analyzeMutation.mutate(files[0]);
  };

  const isPremium = credits?.isPremium ?? false;
  const freeAnalyses = credits?.freeAnalyses ?? 0;
  // Lógica para exibir badge e contador igual Trainer
  const showBadge = true;

  return (
    <div className="min-h-screen flex flex-col">
      <Header showCredits={showBadge} freeAnalysesRemaining={freeAnalyses} isPremium={isPremium} />
      
      <main className="flex-1 bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Analisar Partidas
            </h1>
            <p className="text-lg text-muted-foreground">
              Faça upload dos seus históricos de mãos para receber análises detalhadas
            </p>
          </div>

          {/* Badge/contador Premium no canto direito igual Trainer */}
          <div className="flex justify-end items-center mb-4">
            {isPremium ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold text-base shadow-md">
                <AlertCircle className="w-5 h-5 text-white" />
                Premium • ∞
              </span>
            ) : freeAnalyses > 0 ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-200 text-violet-900 font-bold text-base shadow-md">
                <AlertCircle className="w-5 h-5 text-violet-700" />
                {freeAnalyses}/5 análises grátis
              </span>
            ) : (
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold text-base shadow-md animate-pulse"
                onClick={() => setShowPremiumModal(true)}
                data-testid="button-upgrade-premium-final"
              >
                <AlertCircle className="w-5 h-5 text-white" />
                👑 Assinar Premium
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="max-w-3xl mx-auto space-y-6">
                <Card
                  className={`border-2 border-dashed transition-colors ${
                    isDragging ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <UploadIcon className="w-8 h-8 text-primary" />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Arraste seus arquivos aqui
                    </h3>
                    
                    <p className="text-muted-foreground mb-6 text-center">
                      Ou clique no botão abaixo para selecionar
                    </p>

                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".txt,.csv,.hand"
                      multiple
                      onChange={handleFileInput}
                      data-testid="input-file-upload"
                    />
                    
                    <label htmlFor="file-upload">
                      <Button asChild data-testid="button-select-files">
                        <span>Selecionar Arquivos</span>
                      </Button>
                    </label>

                    <p className="text-sm text-muted-foreground mt-4">
                      Formatos aceitos: .txt, .csv, .hand
                    </p>
                  </CardContent>
                </Card>

                {files.length > 0 && (
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <h4 className="font-semibold text-foreground">
                        Arquivos Selecionados ({files.length})
                      </h4>
                      
                      <div className="space-y-2">
                        {files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            data-testid={`file-item-${index}`}
                          >
                            <div className="flex items-center gap-3">
                              <File className="w-5 h-5 text-primary" />
                              <div>
                                <p className="text-sm font-medium text-foreground">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFile(index)}
                              data-testid={`button-remove-file-${index}`}
                              disabled={analyzeMutation.isPending}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleAnalyze}
                        disabled={analyzeMutation.isPending || files.length === 0}
                        data-testid="button-analyze"
                      >
                        {analyzeMutation.isPending ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Analisando...
                          </>
                        ) : (
                          'Analisar Agora'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {!isPremium && (
                <AdPlaceholder onWatchAd={() => watchAdMutation.mutate()} creditsEarned={1} />
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Como Funciona</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">1. Faça Upload</p>
                    <p className="text-sm text-muted-foreground">
                      Selecione os arquivos de histórico do seu site de poker
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">2. Processamento</p>
                    <p className="text-sm text-muted-foreground">
                      Nossa IA analisa todas as mãos em segundos
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">3. Resultados</p>
                    <p className="text-sm text-muted-foreground">
                      Visualize gráficos e insights detalhados
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Formatos Suportados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-sm text-foreground">PokerStars (.txt)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-sm text-foreground">888poker (.csv)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-sm text-foreground">partypoker (.txt)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-sm text-foreground">GGPoker (.hand)</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      
      <PremiumModal open={showPremiumModal} onOpenChange={setShowPremiumModal} />
    </div>
  );
}
