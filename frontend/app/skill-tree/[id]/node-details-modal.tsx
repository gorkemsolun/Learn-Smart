"use client";

import { NodeData } from "@/app/types";
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
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Code,
  Zap,
} from "lucide-react";

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
  node: NodeData | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!node) {
    return null;
  }

  const LevelIcon =
    (node.level && levelIcons[node.level as keyof typeof levelIcons]) ||
    BookOpen;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="from-background to-background/90 border-border text-foreground bg-gradient-to-br sm:max-w-md">
        <div className="from-background to-background/80 border-background absolute -top-12 left-1/2 flex size-24 -translate-x-1/2 items-center justify-center rounded-full border-4 bg-gradient-to-br shadow-xl">
          <div
            className={`from-primary/80 to-primary flex size-16 items-center justify-center rounded-full bg-gradient-to-br`}
          >
            <LevelIcon className="size-8 text-white" />
          </div>
        </div>

        <DialogHeader className="pt-10 text-center">
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {node.label || `Node ${node.id}`}
          </DialogTitle>
          <div className="mt-2 flex justify-center">
            <Badge
              variant="outline"
              className="bg-primary/10 border-primary/30 text-primary"
            >
              Level {node.level}
            </Badge>

            {node.completed && (
              <Badge className="ml-2 border-emerald-500/30 bg-emerald-500/20 text-emerald-300">
                <CheckCircle2 className="mr-1 size-3" /> Completed
              </Badge>
            )}
          </div>
          <DialogDescription className="text-muted-foreground mt-4">
            {node.description ||
              "No additional information available for this node."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress section */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-foreground font-medium">
                {node.progress || 0}%
              </span>
            </div>
            <Progress value={node.progress || 0} className="bg-muted h-2" />
          </div>

          <Separator className="bg-border" />

          {/* Skills section */}
          {node.skills && node.skills.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-muted-foreground text-sm font-medium">
                Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {node.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-muted hover:bg-muted/80 text-foreground"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {node.prerequisites && node.prerequisites.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-muted-foreground text-sm font-medium">
                Prerequisites
              </h4>
              <div className="space-y-2">
                {node.prerequisites.map((prereq, index) => (
                  <div
                    key={index}
                    className="text-muted-foreground flex items-center text-sm"
                  >
                    <ArrowRight className="text-muted-foreground mr-2 size-3" />
                    {prereq}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 flex gap-2 sm:justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border text-foreground hover:bg-muted hover:text-foreground"
          >
            Close
          </Button>
          <div className="flex gap-2">
            {!node.completed && (
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-muted hover:text-foreground"
              >
                Mark as In Progress
              </Button>
            )}
            <Button className="bg-primary hover:bg-primary/90">
              {node.completed ? "Review Skills" : "Start Learning"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
