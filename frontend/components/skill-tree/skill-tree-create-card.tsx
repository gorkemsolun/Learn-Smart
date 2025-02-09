"use client";

import { SkillTreeCreateProps } from "@/app/types";
import { SkillTreeCreateDialogModal } from "@/components/skill-tree/skill-tree-create-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function SkillTreeCreateCard(
  modalParameters: SkillTreeCreateProps
) {
  const [skillTreeDialog, setSkillTreeDialog] = useState(false);

  return (
    <div className="w-1/4 p-6">
      <Card className="group relative h-[25vh] overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg">
        <div className="from-primary/5 via-secondary/5 to-background absolute inset-0 bg-gradient-to-br" />
        <CardContent className="relative flex h-full flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="z-10 space-y-4"
          >
            <h3 className="text-foreground mb-2 text-2xl font-bold tracking-tight">
              Skill Tree
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Visualize your growth journey
            </p>
            <Button
              onClick={() => {
                setSkillTreeDialog(true);
              }}
              className="bg-background text-foreground hover:bg-foreground hover:text-background relative overflow-hidden transition-all duration-500"
              variant="outline"
            >
              <span className="relative z-10 flex items-center transition-transform duration-500">
                <Plus className="mr-2" size={16} />
                Create Skill Tree
              </span>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
      <SkillTreeCreateDialogModal
        isOpen={skillTreeDialog}
        onClose={() => setSkillTreeDialog(false)}
        onSkillTreeCreation={modalParameters.onSkillTreeUpdate}
      />
    </div>
  );
}
