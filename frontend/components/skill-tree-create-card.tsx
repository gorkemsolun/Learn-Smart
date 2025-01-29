'use client';

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus} from "lucide-react";
import { SkillTreeCreateDialogModal } from "@/components/skill-tree-create-dialog";
import { motion } from "framer-motion";
import {SkillTreeCreateProps} from "@/app/types";

export default function SkillTreeCreateCard(modalParameters: SkillTreeCreateProps) {
  const [skillTreeDialog, setSkillTreeDialog] = useState(false);

  return (
    <div className="w-1/4 p-6">
        <Card
          className="group relative h-[25vh] overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-background"/>
          <CardContent className="relative flex h-full flex-col items-center justify-center p-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="z-10 space-y-4"
            >
              <h3 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
                Skill Tree
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Visualize your growth journey
              </p>
              <Button
                onClick={() => {
                  setSkillTreeDialog(true);
                }}
                className="relative overflow-hidden bg-background text-foreground transition-all duration-500 hover:bg-foreground hover:text-background"
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