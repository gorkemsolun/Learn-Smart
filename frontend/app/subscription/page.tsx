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
  const [startDate, setStartDate] = useState<Date>(null);
  const [endDate, setEndDate] = useState<Date>(null);

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
      setStartDate(new Date(subscriptionResponse.data?.start_date));
      setEndDate(new Date(subscriptionResponse.data?.end_date));
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

  const calculateProratedPrice = (newTierPrice, currentTierPrice) => {
    if (!startDate || !endDate) return newTierPrice;

    const now = Date.now();
    const totalDuration = endDate - startDate;
    const remainingDuration = endDate - now;
    const remainingFraction = remainingDuration / totalDuration;

    const creditAmount = currentTierPrice * remainingFraction;
    const finalPrice = newTierPrice - creditAmount;

    return finalPrice > 0 ? finalPrice.toFixed(2) : "0.00";
  };

  const subscriptionDuration = (endDate - startDate) / (1000 * 60 * 60 * 24);
  const isYearly = subscriptionDuration >= 365;

  const currentMonthlyPrice = currentTier === "basic" ? 7.9 : currentTier === "premium" ? 19.9 : 0;
  const currentYearlyPrice = currentTier === "basic" ? 64.9 : currentTier === "premium" ? 199.9 : 0;

  const tiers =
  [
    {
      name: "Edux Basic",
      description: "Unlimited course and chat creation in Edux System.",
      monthlyPrice: "7.9",
      yearlyPrice: "64.9",
      features: ["Unlimited course/chat creation."],
      badge: currentTier === "basic" ? "Current Plan" : "",
      key: "basic",
      buttonText: currentTierIndex === -1 ? "Choose this plan" : "Upgrade plan",
      isHidden: currentTierIndex > tierOrder.indexOf("basic")
          || ((currentTierIndex === tierOrder.indexOf("basic")) && billingPeriod === "monthly" && !isYearly)
          || ((currentTierIndex === tierOrder.indexOf("basic")) && isYearly)
    },
    {
      name: "Edux+ Premium",
      description: "Personalized study mechanisms and unlimited course/chat creation in Edux.",
      monthlyPrice: isYearly
        ? "19.9"
        : calculateProratedPrice(19.9, currentMonthlyPrice),
      yearlyPrice: isYearly
        ? calculateProratedPrice(199.9, currentYearlyPrice)
        : calculateProratedPrice(199.9, currentMonthlyPrice),
      features: ["Personalized study mechanisms.", "Unlimited course/chat creation."],
      badge: currentTier === "premium" ? "Current Plan" : "Most Popular",
      key: "premium",
      buttonText: currentTierIndex === -1 ? "Choose this plan" : "Upgrade plan",
      isHidden: currentTierIndex > tierOrder.indexOf("premium") || (isYearly &&
          ((currentTierIndex < tierOrder.indexOf("premium")) && billingPeriod === "monthly"))
          || ((currentTierIndex === tierOrder.indexOf("premium")) && billingPeriod === "monthly" && !isYearly)
          || ((currentTierIndex === tierOrder.indexOf("premium")) && isYearly),
    },
    {
      name: "Edux+ Elite",
      description: "Personalized study mechanisms, LLM selection, and unlimited course/chat creation in Edux.",
      monthlyPrice: isYearly
        ? "59.9"
        : calculateProratedPrice(59.9, currentMonthlyPrice),
      yearlyPrice: isYearly
        ? calculateProratedPrice(599.9, currentYearlyPrice)
        : calculateProratedPrice(599.9, currentMonthlyPrice),
      features: [
        "Personalized study mechanisms.",
        "LLM selection for your smart tutor.",
        "Unlimited course creation.",
      ],
      badge: currentTier === "elite" ? "Current Plan" : "",
      key: "elite",
      buttonText: currentTierIndex === -1 ? "Choose this plan" : "Upgrade plan",
      isHidden: (isYearly &&
          ((currentTierIndex < tierOrder.indexOf("elite")) && billingPeriod === "monthly"))
          || ((currentTierIndex === tierOrder.indexOf("elite")) && billingPeriod === "monthly" && !isYearly)
          || ((currentTierIndex === tierOrder.indexOf("elite")) && isYearly),
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