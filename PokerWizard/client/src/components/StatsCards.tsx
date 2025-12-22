import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Hash, Target, Trophy } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative";
  icon: React.ElementType;
}

function StatCard({ title, value, change, changeType, icon: Icon }: StatCardProps) {
  return (
    <Card className="hover-elevate">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
            {change && (
              <div className="flex items-center gap-1 mt-2">
                {changeType === "positive" ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    changeType === "positive" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StatsCards() {
  const stats = [
    {
      title: "Winrate",
      value: "12.5 BB/100",
      change: "+2.3%",
      changeType: "positive" as const,
      icon: Trophy,
    },
    {
      title: "Mãos Jogadas",
      value: "15.432",
      change: "+1.245",
      changeType: "positive" as const,
      icon: Hash,
    },
    {
      title: "ROI",
      value: "24.8%",
      change: "+4.2%",
      changeType: "positive" as const,
      icon: Target,
    },
    {
      title: "Lucro Total",
      value: "R$ 8.450",
      change: "+R$ 1.230",
      changeType: "positive" as const,
      icon: DollarSign,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
