"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { useRouter } from "next/navigation";
import TierCard from "@/components/subscription-tier-card";

const steps = [
  { step: "STEP 1", title: "Tier Plan", status: "current" },
  { step: "STEP 2", title: "Confirmation", status: "upcoming" },
  { step: "STEP 3", title: "Complete", status: "upcoming" },
];

export default function SubscriptionTierCards() {
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const router = useRouter();

  const tiers = [
    {
      name: "Edux Basic",
      description: "RAG based content creation, and unlimited course creation in Edux.",
      monthlyPrice: "7.9",
      yearlyPrice: "64.9",
      features: ["RAG based content creation.", "Unlimited course creation."],
      badge: "",
      llmSelector: false,
    },
    {
      name: "Edux+ Premium",
      description: "Personal Guidance, RAG, and unlimited course creation in Edux.",
      monthlyPrice: "19.9",
      yearlyPrice: "199.9",
      features: ["Personalized guidance.", "RAG based content creation.", "Unlimited course creation."],
      badge: "Most popular",
      llmSelector: false,
    },
    {
      name: "Edux+ Elite",
      description: "Personal Guidance, RAG, LLM selection, and unlimited course creation in Edux.",
      monthlyPrice: "59.9",
      yearlyPrice: "599.9",
      features: [
        "Personalized guidance.",
        "RAG based content creation.",
        "LLM selection for your smart tutor.",
        "Unlimited course creation.",
      ],
      badge: "",
      llmSelector: true,
    },
  ];

  const handleTierSelection = (tier) => {
    const selectedTier = {
      name: tier.name,
      price: billingPeriod === "monthly" ? tier.monthlyPrice : tier.yearlyPrice,
      billingPeriod: billingPeriod,
      features: tier.features,
    };
    router.push(`/subscription/subscription-confirmation?tier=${encodeURIComponent(JSON.stringify(selectedTier))}`);
  };

  return (
    <div className="flex grow flex-col items-center justify-center bg-background">
      <OnboardingProgress steps={steps} />
      <div className="mx-auto w-full max-w-[1200px] px-4">
        <div className="mb-2 flex justify-end">
          <Tabs value={billingPeriod} onValueChange={setBillingPeriod}>
            <TabsList>
              <TabsTrigger value="monthly" className="font-light">Monthly</TabsTrigger>
              <TabsTrigger value="yearly" className="font-light">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier, index) => (
            <TierCard
              key={index}
              tier={tier}
              billingPeriod={billingPeriod}
              handleTierSelection={handleTierSelection}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


