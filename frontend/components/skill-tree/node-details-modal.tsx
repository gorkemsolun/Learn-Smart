"use client";

import { useState, useEffect } from "react";
import type { NodeData } from "@/app/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { BookOpen, CheckCircle2, Clock, LockIcon, BookOpenCheck, Trophy, Calendar } from "lucide-react";
import QuizModal from "./quiz-dialog";
import { skillTreeService } from "@/environment/backend_api";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

export default function NodeDetailsModal({
  node,
  open,
  onClose,
  disabled,
  onNodeStatusChange,
}: {
  node: NodeData | null
  open: boolean
  onClose: () => void
  disabled?: boolean
  onNodeStatusChange?: (nodeId: number, status: string) => void
}) {
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [nodeStatus, setNodeStatus] = useState<string>("");
  const [lastQuizResult, setLastQuizResult] = useState<{ passed: boolean; score: number; date?: Date } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const token = useAuthRedirect();

  // Update node status whenever the node prop changes
  useEffect(() => {
    if (node) {
      setNodeStatus(node.state || "locked_uncompleted");
    }
  }, [node]);

  const handleStartQuiz = () => {
    setIsQuizOpen(true);
  };

  const handleQuizComplete = async (nodeId: number, passed: boolean, score: number) => {
    setIsLoading(true);

    // Save the quiz result with current date
    setLastQuizResult({
      passed,
      score,
      date: new Date(),
    });

    if (passed) {
      try {
        const response = await skillTreeService.post(
          `/update-node?node_id=${nodeId}`,
          { node_id: nodeId },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data && response.data.success) {
          const newStatus = "unlocked_completed";
          setNodeStatus(newStatus);

          // Notify parent component about the status change
          if (onNodeStatusChange) {
            onNodeStatusChange(nodeId, newStatus);
          }
        }
      } catch (error) {
        console.error("Failed to update node status:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }

    // Close the quiz but keep the node details open to show the result
    setIsQuizOpen(false);
  };

  const getStatusBadge = () => {
    switch (nodeStatus) {
      case "unlocked_completed":
        return (
          <Badge className="border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-medium text-emerald-500 dark:text-emerald-400">
            <CheckCircle2 className="mr-1.5 size-4" strokeWidth={1.5} /> Completed
          </Badge>
        );
      case "unlocked_uncompleted":
        return (
          <Badge className="border-amber-500/30 bg-amber-500/10 px-3 py-1 font-medium text-amber-500 dark:text-amber-400">
            <Clock className="mr-1.5 size-4" strokeWidth={1.5} /> In Progress
          </Badge>
        );
      case "locked_uncompleted":
        return (
          <Badge className="border-muted/30 bg-muted/10 px-3 py-1 font-medium text-muted-foreground">
            <LockIcon className="mr-1.5 size-4" strokeWidth={1.5} /> Locked
          </Badge>
        );
      default:
        return (
          <Badge className="border-muted/30 bg-muted/10 px-3 py-1 font-medium text-muted-foreground">
            <Clock className="mr-1.5 size-4" strokeWidth={1.5} /> Uncompleted
          </Badge>
        );
    }
  };

  const getStatusDescription = () => {
    switch (nodeStatus) {
      case "unlocked_completed":
        return "You've successfully completed this skill node.";
      case "unlocked_uncompleted":
        return "This skill is unlocked and ready for you to complete.";
      case "locked_uncompleted":
        return "Complete prerequisite skills to unlock this node.";
      default:
        return "Status information unavailable.";
    }
  };

  const getNodeIcon = () => {
    switch (nodeStatus) {
      case "unlocked_completed":
        return <BookOpenCheck className="size-8" strokeWidth={1.5} />;
      case "unlocked_uncompleted":
        return <BookOpen className="size-8" strokeWidth={1.5} />;
      case "locked_uncompleted":
        return <LockIcon className="size-8" strokeWidth={1.5} />;
      default:
        return <BookOpen className="size-8" strokeWidth={1.5} />;
    }
  };

  if (!node || disabled) {
    return null;
  }

  const hasQuiz = node.quiz && node.quiz.length > 0;
  const canTakeQuiz = nodeStatus === "unlocked_uncompleted";

  // Ensure node has the expected structure for QuizModal
  const enhancedNode = {
    id: node.id,
    name: node.name || `Node ${node.id}`,
    quiz: node.quiz || [],
    state: nodeStatus,
  };

  return (
    <>
      <Dialog open={open && !isQuizOpen} onOpenChange={onClose}>
        <DialogContent className="border-border bg-background text-foreground sm:max-w-md md:max-w-lg">
          <div className="absolute -top-12 left-1/2 flex size-24 -translate-x-1/2 items-center justify-center rounded-full border-4 border-background bg-background shadow-xl">
            <div
              className={`flex size-16 items-center justify-center rounded-full ${
                nodeStatus === "unlocked_completed"
                  ? "bg-emerald-500/20 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : nodeStatus === "unlocked_uncompleted"
                    ? "bg-amber-500/20 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400"
                    : "bg-muted/20 text-muted-foreground"
              }`}
            >
              {getNodeIcon()}
            </div>
          </div>

          <DialogHeader className="pt-12 text-center">
            <DialogTitle className="text-2xl font-semibold tracking-tight">
              {node.name || `Node ${node.id}`}
            </DialogTitle>
            <div className="mt-3 flex justify-center">{getStatusBadge()}</div>
            <p className="mt-2 text-sm text-muted-foreground">{getStatusDescription()}</p>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <Separator className="bg-border/50" />

            {/* Quiz information */}
            {hasQuiz && (
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium">
                      <Trophy className="size-4 text-primary" />
                      <h3>Quiz Assessment</h3>
                    </div>
                    {nodeStatus === "unlocked_completed" && (
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">
                        Passed
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Complete the quiz to demonstrate your understanding of this skill.</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span>Questions:</span>
                      <Badge variant="secondary" className="text-xs">
                        {node.quiz?.length || 0} questions
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span>Passing Score:</span>
                      <Badge variant="secondary" className="text-xs">
                        70%
                      </Badge>
                    </div>
                  </div>

                  {lastQuizResult && (
                    <div className="mt-2 space-y-2">
                      <Separator />
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Your Score:</span>
                        <span
                          className={`font-bold ${lastQuizResult.passed ? "text-emerald-500" : "text-amber-500"}`}
                        >
                          {lastQuizResult.score}%
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{lastQuizResult.score}%</span>
                        </div>
                        <Progress
                          value={lastQuizResult.score}
                          className="h-2"
                          indicatorClassName={lastQuizResult.passed ? "bg-emerald-500" : "bg-amber-500"}
                        />
                      </div>
                      {lastQuizResult.date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="size-3" />
                          <span>Taken {formatDistanceToNow(lastQuizResult.date, { addSuffix: true })}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {lastQuizResult && !lastQuizResult.passed && (
              <div className="rounded-lg border border-amber-200/50 bg-amber-100/50 p-4 text-sm text-amber-700 dark:border-amber-800/30 dark:bg-amber-900/10 dark:text-amber-400">
                <div className="flex gap-2">
                  <Clock className="size-5 shrink-0" />
                  <div>
                    <p className="font-medium">You didn&#39;t pass the quiz yet</p>
                    <p>
                      Review the material and try again. You need to score at least 70% to complete this skill node.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              className="border-border font-medium text-foreground hover:bg-muted hover:text-foreground"
              onClick={onClose}
            >
              Close
            </Button>

            {hasQuiz && canTakeQuiz && (
              <Button
                className="bg-primary font-medium hover:bg-primary/90"
                onClick={handleStartQuiz}
                disabled={isLoading}
              >
                {nodeStatus === "unlocked_completed" ? "Retake Quiz" : "Take Quiz"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {node && (
        <QuizModal
          node={enhancedNode}
          open={isQuizOpen}
          onClose={() => {
            setIsQuizOpen(false);
          }}
          onQuizComplete={handleQuizComplete}
        />
      )}
    </>
  );
}