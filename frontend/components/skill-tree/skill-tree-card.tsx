"use client";

import { SkillTreeCardProps } from "@/app/types";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { SkillTreeEditCreateDialogModal } from "@/components/skill-tree/skill-tree-edit-create-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Pencil2Icon, TrashIcon } from "@radix-ui/react-icons";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { VscDebugRestart } from "react-icons/vsc";

export function SkillTreeCard(modalParameters: SkillTreeCardProps) {
  const router = useRouter();
  const [skillTreeEditDialogOpen, setSkillTreeEditDialogOpen] =
    useState<boolean>(false);
  const handleCardClick = (id: string) => {
    router.push(`/skill-tree/${id}`);
  };

  return (
    <Card
      key={modalParameters.id}
      className="group h-[25vh] overflow-hidden transition-all duration-300 hover:shadow-lg"
    >
      <CardContent className="flex h-full flex-col justify-between p-0">
        <div className="from-primary/5 via-secondary/5 to-background space-y-2 bg-gradient-to-br p-6">
          <CardTitle className="line-clamp-1 overflow-hidden text-xl font-bold">
            {modalParameters.title}
          </CardTitle>
          <p className="text-muted-foreground line-clamp-1 overflow-hidden text-sm">
            {modalParameters.description || "No description available"}
          </p>
        </div>
        <div className="bg-muted/50 flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setSkillTreeEditDialogOpen(true)}
            >
              <Pencil2Icon />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                console.log("TODO on Reset");
              }}
            >
              <VscDebugRestart />
            </Button>
            <ConfirmationDialog
              title={`Confirm Deleting Skill Tree "${modalParameters.title}"`}
              description={`Are you sure you want to delete the skill tree named "${modalParameters.title}"? This action cannot be undone.`}
              triggerButtonLabel={<TrashIcon />}
              onConfirm={() =>
                modalParameters.onSkillTreeDelete(modalParameters.id)
              }
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

      <SkillTreeEditCreateDialogModal
        isOpen={skillTreeEditDialogOpen}
        onClose={() => setSkillTreeEditDialogOpen(false)}
        onSkillTreeSubmit={() => {
          console.log("TODO on SkillTreeUpdate");
        }} // TO-DO)}
        skillTree={modalParameters} // Skill Tree data which is SkillTreeCardProps
        isEdit={true}
      />
    </Card>
  );
}
