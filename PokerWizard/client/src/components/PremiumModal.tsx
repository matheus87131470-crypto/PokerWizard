import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, CreditCard, Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { useToast } from "@/hooks/use-toast";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const freeFeatures = [
  "5 análises gratuitas",
  "Gráficos básicos",
  "Upload de arquivos",
  "Com anúncios",
];

const premiumFeatures = [
  "Análises ilimitadas",
  "Todos os gráficos avançados",
  "Sem anúncios",
  "Exportar relatórios PDF",
  "Suporte prioritário",
  "Histórico completo",
];

export default function PremiumModal({ open, onOpenChange }: PremiumModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const { sessionId } = await response.json();
      
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }
      
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Erro ao processar pagamento",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl" data-testid="modal-premium">
        <DialogHeader>
          <DialogTitle className="text-3xl">Desbloqueie Todo o Potencial</DialogTitle>
          <DialogDescription className="text-base">
            Análises ilimitadas e recursos avançados por apenas R$10/mês
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                <X className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Plano Gratuito</h3>
            </div>
            
            <div className="space-y-3">
              {freeFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 border-l border-border pl-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Premium</h3>
              <span className="ml-auto text-2xl font-bold text-primary">R$ 10/mês</span>
            </div>
            
            <div className="space-y-3">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              className="w-full mt-6"
              size="lg"
              onClick={handleSubscribe}
              disabled={isLoading}
              data-testid="button-subscribe-modal"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Assinar Agora
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Pagamento seguro • Cancele quando quiser
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
