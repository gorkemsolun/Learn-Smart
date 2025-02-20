import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircledIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import tier_logo from "@/assets/subs-tier.jpg";
import { SeperatorWithContent } from "@/components/ui/seperator-w-content";

function FeatureList({ items }) {
  return (
    <ul className="space-y-3 pt-2 text-sm text-foreground/70">
      {items.map((item, index) => (
        <li key={index} className="flex items-center gap-2">
          <CheckCircledIcon className="size-4 text-foreground/50" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function TierCard({ tier, billingPeriod, handleTierSelection }) {
  return (
    <Card className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5 backdrop-blur-lg">
      {tier_logo && (
        <div className="pointer-events-none absolute inset-0">
          <Image
            src={tier_logo}
            alt="Logo"
            layout="fill"
            objectFit="cover"
            className="opacity-5"
          />
        </div>
      )}

      {tier?.badge && (
        <Badge className="absolute right-6 top-6 rounded-2xl bg-primary px-3 py-1 text-xs font-thin text-background">
          {tier?.badge}
        </Badge>
      )}

      <CardContent className={`relative z-10 px-6 ${(tier.isHidden && tier.key === "elite") ? "mb-28 py-12" : "py-12"}`}>
        <div className="space-y-6">
          <h3 className="text-2xl font-thin text-foreground/90">{tier.name}</h3>
          <p className="text-sm text-foreground/70">{tier.description}</p>

          {!tier.isHidden && (
              <>
                <div className="text-xl font-semibold text-foreground">
                  ${billingPeriod === "monthly" ? tier.monthlyPrice : tier.yearlyPrice}
                  <span className="text-sm text-foreground/60">
                    {billingPeriod === "monthly" ? "/month" : "/year"}
                  </span>
                </div>
                <Button
                    className="w-full rounded-lg font-light text-background"
                    onClick={() => handleTierSelection(tier)}
                >
                  {tier.buttonText}
                </Button>
              </>
          )}
          <SeperatorWithContent>{tier.name}</SeperatorWithContent>
          <FeatureList items={tier.features}/>
        </div>
      </CardContent>
    </Card>
  );
}
