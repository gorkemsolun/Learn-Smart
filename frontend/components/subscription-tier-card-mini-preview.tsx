import { Tier } from "@/app/types";
import tier_logo from "@/assets/subs-tier.jpg";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon } from "lucide-react";
import Image from "next/image";


interface FeatureListProps {
  features: string[];
}

function FeatureList({ features }: FeatureListProps) {
  const displayCount = 3;
  const displayFeatures = features.slice(0, displayCount);
  const hasMore = features.length > displayCount;
  const paddedFeatures = [
    ...displayFeatures,
    ...Array(displayCount - displayFeatures.length).fill(""),
  ];

  return (
    <ul className={`space-y-2 text-xs text-background/80`}>
      {paddedFeatures.map((feature, idx) => (
        <li key={idx} className="flex items-center gap-2">
          {feature ? (
            <CheckIcon className={`size-3 text-background/70`} />
          ) : (
            <div className="m-1 size-3" />
          )}
          {feature ? feature : <span className="m-1 inline-block size-3" />}
        </li>
      ))}
      <li className="flex items-center gap-2">
        {hasMore && <CheckIcon className={`size-3 text-background/70`} />}
        {hasMore ? (
          `+${features.length - displayCount} more features`
        ) : (
          <span className="inline-block size-3" />
        )}
      </li>
    </ul>
  );
}

interface TierCardMiniProps {
  tier: Tier;
}

export default function TierCardMini({
  tier,
}: TierCardMiniProps) {

  return (
    <Card className="relative overflow-hidden rounded-xl border-none bg-primary-foreground/10 backdrop-blur-sm">
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
        <Badge className="pointer-events-none absolute right-2 top-2 line-clamp-1 cursor-default select-none rounded-full bg-primary-foreground px-2 py-0.5 text-[10px] font-medium text-primary">
          {tier.badge}
        </Badge>
      )}
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-medium text-background`}>{tier.name}</h3>
            <div className="text-right">
              <div className={`text-lg font-semibold text-background`}>
                ${tier.price}
              </div>
              <div className={`text-xs text-background`}>
                {tier.billingPeriod === "monthly" ? "/month" : "/year"}
              </div>
            </div>
          </div>
          {tier.llm && (
            <p className={`text-xs text-background`}>
              <span className="font-medium">Model:</span> {tier.llm}
            </p>
          )}
          <FeatureList features={tier.features} />
        </div>
      </CardContent>
    </Card>
  );
}
