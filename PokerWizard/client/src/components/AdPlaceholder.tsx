import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";
import { useState } from "react";

interface AdPlaceholderProps {
  onWatchAd?: () => void;
  onClose?: () => void;
  creditsEarned?: number;
}

export default function AdPlaceholder({ onWatchAd, onClose, creditsEarned = 1 }: AdPlaceholderProps) {
  const [isWatching, setIsWatching] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const handleWatchAd = () => {
    setIsWatching(true);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsWatching(false);
          setCountdown(5);
          onWatchAd?.();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (isWatching) {
    return (
      <Card className="border-2 border-dashed border-primary/50">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Eye className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Assistindo Anúncio...</h3>
            <p className="text-4xl font-bold text-primary">{countdown}s</p>
            <p className="text-sm text-muted-foreground">
              Aguarde para ganhar {creditsEarned} análise grátis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed border-border relative" data-testid="card-ad-placeholder">
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={onClose}
          data-testid="button-close-ad"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
      
      <CardContent className="p-8">
        <div className="text-center space-y-4">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Anúncio</span>
          
          <div className="w-full h-32 bg-muted/30 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Espaço para Google AdSense</p>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleWatchAd}
              variant="outline"
              className="gap-2"
              data-testid="button-watch-ad"
            >
              <Eye className="w-4 h-4" />
              Assistir para Ganhar {creditsEarned} Análise
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
