"use client";

import {useEffect, useState} from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { useRouter } from "next/navigation";
import TierCard from "@/components/subscription-tier-card";
import {subscriptionService} from "@/environment/backend_api";
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
      const subscriptionResponse = await subscriptionService.get("/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setCurrentTier(subscriptionResponse.data?.subscription_tier);
      setStartDate(new Date(subscriptionResponse.data?.start_date));
      setEndDate(new Date(subscriptionResponse.data?.end_date));
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        console.error("Error fetching subscription data:", error);
      }
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

  const calculateProratedPrice = (newTierPrice, currentTierPrice, startDate, endDate) => {
    if (!startDate || !endDate) return newTierPrice.toFixed(2);

    const now = Date.now();
    const totalDuration = endDate - startDate;
    const remainingDuration = Math.max(0, endDate - now);
    const remainingFraction = remainingDuration / totalDuration;

    const creditAmount = currentTierPrice * remainingFraction;
    const finalPrice = newTierPrice - creditAmount;

    return finalPrice > 0 ? finalPrice.toFixed(2) : "0.00";
  };

  const subscriptionDurationDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
  const isCurrentYearly = subscriptionDurationDays >= 365;

  const currentMonthlyPrice = currentTier === "basic"   ? 1.9
                             : currentTier === "premium" ? 7.9
                             : currentTier === "elite"   ? 19.9
                             : 0;
  const currentYearlyPrice  = currentTier === "basic"   ? 9.9
                             : currentTier === "premium" ? 64.9
                             : currentTier === "elite"   ? 199.9
                             : 0;

  const getCurrentPrice = () => isCurrentYearly ? currentYearlyPrice : currentMonthlyPrice;

  const getDisplayedPrice = (newPrice) => {
    if (currentTierIndex === -1) {
      return newPrice.toFixed(2);
    }

    const proratedPrice = calculateProratedPrice(newPrice, getCurrentPrice(), startDate, endDate);
    return proratedPrice;
  };

  const calculateRawProratedPrice = (newTierPrice, currentTierPrice, startDate, endDate) => {
    if (!startDate || !endDate) return newTierPrice;

    const now = Date.now();
    const totalDuration = endDate - startDate;
    const remainingDuration = Math.max(0, endDate - now);
    const remainingFraction = remainingDuration / totalDuration;

    const creditAmount = currentTierPrice * remainingFraction;
    return Math.max(0, newTierPrice - creditAmount);
  };

  const getRawPrice = (planKey, requestedBillingPeriod) => {
    const planPrices = {
      "basic": { monthly: 1.9, yearly: 9.9 },
      "premium": { monthly: 7.9, yearly: 64.9 },
      "elite": { monthly: 19.9, yearly: 199.9 }
    };

    const newPrice = planPrices[planKey][requestedBillingPeriod];

    if (currentTierIndex === -1) {
      return newPrice;
    }

    return calculateRawProratedPrice(newPrice, getCurrentPrice(), startDate, endDate);
  };

  const shouldShowPlan = (planKey, requestedBillingPeriod) => {
    const rawPrice = getRawPrice(planKey, requestedBillingPeriod);
    if (rawPrice <= 0) {
      return false;
    }

    if (currentTierIndex === -1 || tierOrder.indexOf(planKey) > currentTierIndex) {
      return true;
    }

    if (tierOrder.indexOf(planKey) === currentTierIndex) {
      return !((requestedBillingPeriod === "monthly" && !isCurrentYearly) ||
          (requestedBillingPeriod === "yearly" && isCurrentYearly));
    }

    return false;
  };

  const tiers = [
    {
      name: "Edux Basic",
      description: "Unlimited course/chat creation in Edux, you may keep your courses now.",
      monthlyPrice: getDisplayedPrice(1.9),
      yearlyPrice: getDisplayedPrice(9.9),
      features: ["Unlimited course/chat creation."],
      badge: currentTier === "basic" ? "Current Plan" : "",
      key: "basic",
      buttonText: currentTierIndex === -1
        ? "Choose this plan"
        : (currentTier === "basic" && ((billingPeriod === "monthly" && isCurrentYearly) ||
                                      (billingPeriod === "yearly" && !isCurrentYearly)))
          ? "Switch billing cycle"
          : "Upgrade plan",
      isHidden: !shouldShowPlan("basic", billingPeriod)
    },
    {
      name: "Edux+ Premium",
      description: "RAG, unlimited course/chat creation in Edux, and quiz yourself with new material.",
      monthlyPrice: getDisplayedPrice(7.9),
      yearlyPrice: getDisplayedPrice(64.9),
      features: ["RAG based content creation.", "Unlimited course/chat creation."],
      badge: currentTier === "premium" ? "Current Plan" : "Most Popular",
      key: "premium",
      buttonText: currentTierIndex === -1
        ? "Choose this plan"
        : (currentTier === "premium" && ((billingPeriod === "monthly" && isCurrentYearly) ||
                                        (billingPeriod === "yearly" && !isCurrentYearly)))
          ? "Switch billing cycle"
          : "Upgrade plan",
      isHidden: !shouldShowPlan("premium", billingPeriod)
    },
    {
      name: "Edux+ Elite",
      description: "RAG, LLM choice, and unlimited course/chat creation in Edux.",
      monthlyPrice: getDisplayedPrice(19.9),
      yearlyPrice: getDisplayedPrice(199.9),
      features: [
        "RAG based content creation.",
        "LLM selection for your smart tutor.",
        "Unlimited course creation.",
      ],
      badge: currentTier === "elite" ? "Current Plan" : "",
      key: "elite",
      buttonText: currentTierIndex === -1
        ? "Choose this plan"
        : (currentTier === "elite" && ((billingPeriod === "monthly" && isCurrentYearly) ||
                                      (billingPeriod === "yearly" && !isCurrentYearly)))
          ? "Switch billing cycle"
          : "Upgrade plan",
      isHidden: !shouldShowPlan("elite", billingPeriod)
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