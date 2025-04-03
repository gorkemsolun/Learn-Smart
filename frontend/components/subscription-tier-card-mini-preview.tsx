import tier_logo from "@/assets/subs-tier.jpg";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon } from "lucide-react";
import Image from "next/image";

function FeatureList({ items }) {
  return (
    <ul className="space-y-2 text-xs text-primary-foreground/80">
      {items.slice(0, 3).map((item, index) => (
        <li key={index} className="flex items-center gap-2">
          <CheckIcon className="size-3 text-primary-foreground/70" />
          {item}
        </li>
      ))}
      {items.length > 3 && <li className="text-primary-foreground/70">+{items.length - 3} more features</li>}
    </ul>
  );
}

export default function TierCardMini({ tier }) {
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
          {tier?.badge}
        </Badge>
      )}
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-primary-foreground">{tier.name}</h3>
            <div className="text-right">
              <div className="text-lg font-semibold text-primary-foreground">${tier.price}</div>
              <div className="text-xs text-primary-foreground/70">
                {tier.billingPeriod === "monthly" ? "/month" : "/year"}
              </div>
            </div>
          </div>
          {tier.llm && (
            <p className="text-xs text-primary-foreground/80">
              <span className="font-medium">LLM:</span> {tier.llm}
            </p>
          )}
          <FeatureList items={tier.features} />
        </div>
      </CardContent>
    </Card>
  );
}

