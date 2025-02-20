"use client";

import {useEffect, useState} from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { useRouter } from "next/navigation";
import TierCard from "@/components/subscription-tier-card";
import {backendAPI} from "@/environment/backend_api";
import Cookies from "js-cookie";
import * as React from "react";

const steps = [
  { step: "STEP 1", title: "Tier Plan", status: "current" },
  { step: "STEP 2", title: "Confirmation", status: "upcoming" },
  { step: "STEP 3", title: "Complete", status: "upcoming" },
];

export default function SubscriptionTierCards() {
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [currentTier, setCurrentTier] = useState(null);
  const router = useRouter();
  const token = Cookies.get("authToken") as string;
  const [loading, setLoading] = useState(true);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      const subscriptionResponse = await backendAPI.get("/subscriptions/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setCurrentTier(subscriptionResponse.data?.subscription_tier);
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSubscriptionData();
    }
  }, [token]);

  const tierOrder = ["basic", "premium", "elite"];
  const currentTierIndex = currentTier ? tierOrder.indexOf(currentTier) : -1;

  const tiers = [
    {
      name: "Edux Basic",
      description: "RAG based content creation, and unlimited course creation in Edux.",
      monthlyPrice: "7.9",
      yearlyPrice: "64.9",
      features: ["RAG based content creation.", "Unlimited course creation."],
      badge: "",
      key: "basic",
      buttonText: currentTierIndex === -1 ? "Choose this plan" : "Upgrade plan",
      isHidden: currentTierIndex >= tierOrder.indexOf("basic"),
    },
    {
      name: "Edux+ Premium",
      description: "Personal Guidance, RAG, and unlimited course creation in Edux.",
      monthlyPrice: "19.9",
      yearlyPrice: "199.9",
      features: ["Personalized guidance.", "RAG based content creation.", "Unlimited course creation."],
      badge: "Most popular",
      key: "premium",
      buttonText: currentTierIndex === -1 ? "Choose this plan" : "Upgrade plan",
      isHidden: currentTierIndex >= tierOrder.indexOf("premium"),
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
      key: "elite",
      buttonText: currentTierIndex === -1 ? "Choose this plan" : "Upgrade plan",
      isHidden: currentTierIndex >= tierOrder.indexOf("elite"),
    },
  ];

  const handleTierSelection = (tier) => {
    const selectedTier = {
      name: tier.name,
      price: billingPeriod === "monthly" ? tier.monthlyPrice : tier.yearlyPrice,
      billingPeriod: billingPeriod,
      features: tier.features,
      key: tier.key,
    };
    router.push(`/subscription/subscription-confirmation?tier=${encodeURIComponent(JSON.stringify(selectedTier))}`);
  };

  return (
      <div className="flex grow flex-col items-center justify-center bg-background">
        <OnboardingProgress steps={steps}/>
        <div className="mx-auto w-full max-w-[1200px] px-4">
          <div className="mb-2 flex justify-end">
            <Tabs value={billingPeriod} onValueChange={setBillingPeriod}>
              <TabsList>
                <TabsTrigger value="monthly" className="font-light">Monthly</TabsTrigger>
                <TabsTrigger value="yearly" className="font-light">Yearly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
              <div className="flex h-[50vh] items-center justify-center">
                <span className="text-gray-500">Loading...</span>
              </div>
          ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {tiers.map((tier) => (
                    <TierCard
                        key={tier.key}
                        tier={tier}
                        billingPeriod={billingPeriod}
                        handleTierSelection={handleTierSelection}
                    />
                ))}
              </div>
          )}
        </div>
      </div>
  );
}