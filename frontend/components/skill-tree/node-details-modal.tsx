"use client";

import type { NodeData } from "@/app/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Award, BookOpen, CheckCircle2, Code, Zap } from "lucide-react";

const levelIcons = {
  1: BookOpen,
  2: Code,
  3: Zap,
  4: Award,
};

export default function NodeDetailsModal({
  node,
  open,
  onClose,
}: {
  node: NodeData | null
  open: boolean
  onClose: () => void
}) {
  if (!node) {
    return null;
  }

  const LevelIcon = (node.level && levelIcons[node.level as keyof typeof levelIcons]) || BookOpen;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-border bg-gradient-to-br from-background to-background/90 text-foreground sm:max-w-md">
        <div className="absolute -top-12 left-1/2 flex size-24 -translate-x-1/2 items-center justify-center rounded-full border-4 border-background bg-gradient-to-br from-background to-background/80 shadow-xl">
          <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary">
            <LevelIcon className="size-8 text-white" strokeWidth={1.5} />
          </div>
        </div>

        <DialogHeader className="pt-10 text-center">
          <DialogTitle className="text-2xl font-light tracking-tight">{node.label || `Node ${node.id}`}</DialogTitle>
          <div className="mt-2 flex justify-center gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 font-light text-primary">
              Level {node.level}
            </Badge>

            {node.completed && (
              <Badge className="border-emerald-500/30 bg-emerald-500/10 font-light text-emerald-300">
                <CheckCircle2 className="mr-1 size-3" strokeWidth={1.5} /> Completed
              </Badge>
            )}
          </div>
          <DialogDescription className="mt-4 font-extralight text-muted-foreground">
            {node.description || "No additional information available for this node."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress section */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-light">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-normal text-foreground">{node.progress || 0}%</span>
            </div>
            <Progress value={node.progress || 0} className="h-1.5 bg-muted" />
          </div>

          <Separator className="bg-border/50" />

          {/* Skills section */}
          {node.skills && node.skills.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-light text-muted-foreground">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {node.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-muted/70 font-extralight text-foreground hover:bg-muted/80"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {node.prerequisites && node.prerequisites.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-light text-muted-foreground">Prerequisites</h4>
              <div className="space-y-2">
                {node.prerequisites.map((prereq, index) => (
                  <div key={index} className="flex items-center text-sm font-extralight text-muted-foreground">
                    <ArrowRight className="mr-2 size-3 text-muted-foreground" strokeWidth={1.5} />
                    {prereq}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
          <div className="flex gap-2">
            {!node.completed && (
              <Button
                variant="outline"
                className="border-border font-light text-foreground hover:bg-muted hover:text-foreground"
              >
                Mark as In Progress
              </Button>
            )}
            <Button className="bg-primary font-light hover:bg-primary/90">
              {node.completed ? "Review Skills" : "Start Learning"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
