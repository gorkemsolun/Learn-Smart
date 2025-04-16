import { Tier } from "@/app/types";
import tier_logo from "@/assets/subs-tier.jpg";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon } from "lucide-react";
import Image from "next/image";

type FontColor = "black" | "white";

interface FeatureListProps {
  features: string[];
  fontColor?: FontColor;
}

function FeatureList({ features, fontColor = "black" }: FeatureListProps) {
  const base = fontColor === "white" ? "text-white" : "text-black";
  return (
    <ul className={`${base}/80 space-y-2 text-xs`}>
      {features.slice(0, 3).map((feature, index) => (
        <li key={index} className="flex items-center gap-2">
          <CheckIcon className={`${base}/70 size-3`} />
          {feature}
        </li>
      ))}
      {features.length > 3 && (
        <li className={`${base}/70`}>+{features.length - 3} more features</li>
      )}
    </ul>
  );
}

interface TierCardMiniProps {
  tier: Tier;
  fontColor?: FontColor;
}

export default function TierCardMini({
  tier,
  fontColor = "black",
}: TierCardMiniProps) {
  const titleClass = fontColor === "white" ? "text-white" : "text-black";
  const subtitleClass =
    fontColor === "white" ? "text-white/70" : "text-black/70";

  return (
    <Card className="bg-primary-foreground/10 relative overflow-hidden rounded-xl border-none backdrop-blur-sm">
      {tier_logo && (
        <Image
          src={tier_logo}
          alt="Logo"
          layout="fill"
          objectFit="cover"
          className="pointer-events-none opacity-10"
        />
      )}
      {tier?.badge && (
        <Badge className="bg-primary-foreground text-primary pointer-events-none absolute right-2 top-2 line-clamp-1 cursor-default select-none rounded-full px-2 py-0.5 text-[10px] font-medium">
          {tier.badge}
        </Badge>
      )}
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className={`${titleClass} text-lg font-medium`}>{tier.name}</h3>
            <div className="text-right">
              <div className={`${titleClass} text-lg font-semibold`}>
                ${tier.price}
              </div>
              <div className={`${subtitleClass} text-xs`}>
                {tier.billingPeriod === "monthly" ? "/month" : "/year"}
              </div>
            </div>
          </div>
          {tier.llm && (
            <p className={`${subtitleClass} text-xs`}>
              <span className="font-medium">LLM:</span> {tier.llm}
            </p>
          )}
          <FeatureList features={tier.features} fontColor={fontColor} />
        </div>
      </CardContent>
    </Card>
  );
}
