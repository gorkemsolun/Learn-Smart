"use client";

import { Tier } from "@/app/types";
import TierCardMini from "@/components/subscription-tier-card-mini-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

const AVAILABLE_TIERS: Tier[] = [
  {
    name: "Edux+ Basic",
    price: 9.99,
    billingPeriod: "monthly",
    llm: "GPT-3.5",
    features: ["Feature A", "Feature B", "Feature C", "Extra D"],
    badge: null,
  },
  {
    name: "Edux+ Pro",
    price: 19.99,
    billingPeriod: "monthly",
    llm: "GPT-4",
    features: ["Everything in Basic", "Priority support", "Extra Pro feature"],
    badge: "Popular",
  },
  {
    name: "Edux+ Elite",
    price: 199.99,
    billingPeriod: "yearly",
    llm: "GPT-4 Turbo",
    features: [
      "Everything in Pro",
      "Dedicated account manager",
      "Custom integrations",
    ],
    badge: "Best Value",
  },
];

interface ManageSubscriptionDialogProps {
  currentPlanName: string;
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onUpgrade: (tier: Tier) => void;
}

export function ManageSubscriptionDialog({
  currentPlanName,
  isOpen,
  onClose,
  onUpgrade,
}: ManageSubscriptionDialogProps) {
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);

  // reset selection whenever dialog opens
  useEffect(() => {
    if (isOpen) setSelectedTier(null);
  }, [isOpen]);

  function handleConfirm() {
    if (!selectedTier) return;
    onUpgrade(selectedTier);
    onClose(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => onClose(open)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-thin">
            Choose a Plan
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 md:grid-cols-3">
          {AVAILABLE_TIERS.map((tier) => {
            const isCurrent = tier.name === currentPlanName;
            return (
              <div key={tier.name} className="relative">
                <TierCardMini
                  tier={tier}
                  fontColor={"white"}
                />
                <Button
                  className={`mt-2 w-full font-thin ${
                    isCurrent
                      ? "cursor-not-allowed opacity-50"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                  disabled={isCurrent}
                  onClick={() => setSelectedTier(tier)}
                >
                  {isCurrent ? "Current Plan" : "Select"}
                </Button>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onClose(false)}>
            Cancel
          </Button>
          <Button
            disabled={!selectedTier || selectedTier.name === currentPlanName}
            onClick={handleConfirm}
          >
            {selectedTier?.name === currentPlanName
              ? "Already Selected"
              : "Confirm Upgrade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
