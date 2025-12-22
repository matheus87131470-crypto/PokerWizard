import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import avatar1 from "@assets/generated_images/Testimonial_avatar_1_826e347a.png";
import avatar2 from "@assets/generated_images/Testimonial_avatar_2_c9327087.png";
import avatar3 from "@assets/generated_images/Testimonial_avatar_3_069e5d1f.png";

const testimonials = [
  {
    name: "Carlos Silva",
    role: "Jogador PokerStars",
    avatar: avatar1,
    rating: 5,
    comment: "Melhorei meu winrate em 15% após identificar os vazamentos no meu jogo. Ferramenta essencial!",
  },
  {
    name: "Marina Santos",
    role: "Jogadora 888poker",
    avatar: avatar2,
    rating: 5,
    comment: "Interface super intuitiva e gráficos claros. Vale cada centavo da assinatura.",
  },
  {
    name: "Roberto Lima",
    role: "Jogador partypoker",
    avatar: avatar3,
    rating: 5,
    comment: "A análise detalhada me ajudou a entender exatamente onde estava perdendo dinheiro.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            O Que Dizem Nossos Jogadores
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Mais de 1.000 jogadores confiam no PokerStats
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover-elevate" data-testid={`card-testimonial-${index}`}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                
                <p className="text-foreground italic">"{testimonial.comment}"</p>
                
                <div className="flex items-center gap-3 pt-4">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
