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
import { useEffect } from "react";

interface UpgradePlanDialogProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  currentTier: Tier;
  newTier: Tier;
  onConfirm: () => void;
}

export function UpgradePlanDialog({
  isOpen,
  onClose,
  currentTier,
  newTier,
  onConfirm,
}: UpgradePlanDialogProps) {
  useEffect(() => {
    if (isOpen) {
      // TODO: reset scroll position or focus on the first input
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => onClose(open)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-thin">
            Confirm Plan Upgrade
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4 md:flex-row md:gap-4">
          <div className="flex-1">
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Current Plan
            </h4>
            <TierCardMini tier={currentTier} fontColor="white" />
          </div>

          <div className="hidden items-center justify-center px-2 md:flex">
            <span className="text-2xl font-thin">→</span>
          </div>

          <div className="flex-1">
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Recommended Plan
            </h4>
            <TierCardMini tier={newTier} fontColor="white" />
          </div>
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onClose(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Proceed</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
