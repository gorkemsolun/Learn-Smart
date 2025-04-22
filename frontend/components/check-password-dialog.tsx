"use client";

import { CheckPasswordDialogProps } from "@/app/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import * as React from "react";
import { useState } from "react";

export function CheckPasswordDialog(props: CheckPasswordDialogProps) {
  const [password, setPassword] = useState<string>("");
  const { toast } = useToast();

  function handleClose() {
    setPassword("");
    props.onClose(false);
  }

  function handleSubmit(
    event:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    event.preventDefault();

    // NOTE: IMPLEMENT THIS LATER
    if (password === "secret123") {
      toast({
        title: "Success",
        description: "Password is correct",
        variant: "default",
      });
      if (props.onCheckSuccess) {
        props.onCheckSuccess();
      }
      handleClose();
    } else {
      toast({
        title: "Error",
        description: "Incorrect password",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={props.isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogTitle>Check Password</DialogTitle>
        <DialogDescription>
          Please enter your password below. REMOVE THIS CORRECT PASSWORD IS
          secret123
        </DialogDescription>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!password}>
              Check
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
