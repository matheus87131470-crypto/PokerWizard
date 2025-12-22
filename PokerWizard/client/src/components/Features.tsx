import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import uploadImage from "@assets/generated_images/Upload_interface_feature_ed3ec1bf.png";
import statsImage from "@assets/generated_images/Statistics_graphs_feature_73d0f254.png";
import { Upload, LineChart, Zap } from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Upload Simples",
    description: "Faça upload dos históricos de mãos dos principais sites de poker em segundos.",
    image: uploadImage,
  },
  {
    icon: LineChart,
    title: "Gráficos Detalhados",
    description: "Visualize winrate, VPIP, PFR, 3-bet e muito mais em gráficos interativos.",
    image: statsImage,
  },
  {
    icon: Zap,
    title: "Análise Instantânea",
    description: "Processe milhares de mãos e receba insights em tempo real sobre seu desempenho.",
    image: statsImage,
  },
];

export default function Features() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Recursos Profissionais
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ferramentas poderosas para elevar seu jogo ao próximo nível
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover-elevate" data-testid={`card-feature-${index}`}>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{feature.description}</p>
                <div className="rounded-lg overflow-hidden border border-card-border">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
