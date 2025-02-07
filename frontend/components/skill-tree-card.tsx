"use client";

import {SkillTreeCardProps} from "@/app/types";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
// import { SkillTreeEditDialogModal } from "@/components/course-edit-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Pencil2Icon, TrashIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {ChevronRight} from "lucide-react";

export function SkillTreeCard(modalParameters: SkillTreeCardProps) {
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const handleCardClick = (id: string) => {
    router.push(`/skill-tree/${id}`);
  };

  return (
    <Card
        key={modalParameters.id}
        className="group h-[25vh] overflow-hidden transition-all duration-300 hover:shadow-lg"
    >
      <CardContent
        className="flex h-full flex-col justify-between p-0"
      >
        <div className="space-y-2 bg-gradient-to-br from-primary/5 via-secondary/5 to-background p-6">
          <CardTitle className="line-clamp-1 overflow-hidden text-xl font-bold">{modalParameters.title}</CardTitle>
          <p className="line-clamp-1 overflow-hidden text-sm text-muted-foreground">{modalParameters.description || "No description available"}</p>
        </div>
        <div className="flex items-center justify-between bg-muted/50 p-4">
          <div className="flex items-center space-x-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setEditDialogOpen(true)}
            >
              <Pencil2Icon />
            </Button>
            <ConfirmationDialog
              title={`Confirm Deleting Skill Tree "${modalParameters.title}"`}
              description={`Are you sure you want to delete the skill tree named "${modalParameters.title}"? This action cannot be undone.`}
              triggerButtonLabel={<TrashIcon />}
              onConfirm={() => modalParameters.onSkillTreeDelete(modalParameters.id)}
            />
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => handleCardClick(modalParameters.id)}
          >
            View <ChevronRight className="ml-2 size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
