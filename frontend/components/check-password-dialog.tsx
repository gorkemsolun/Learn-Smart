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
import { authService } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import Cookies from "js-cookie";
import * as React from "react";
import { useState } from "react";

export function CheckPasswordDialog(props: CheckPasswordDialogProps) {
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [token] = useState<string>(Cookies.get("authToken") as string);

  function handleClose() {
    setPassword("");
    props.onClose(false);
  }

  async function handleSubmit(
    event:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    event.preventDefault();
    setIsLoading(true);

    try {
      // pull your JWT however you store it
      const res = await authService.post(
        "/verify-password",
        {
          current_password: password,
        },
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.status === 200) {
        toast({
          title: "Success",
          description: "Password verified",
          variant: "default",
        });
        props.onCheckSuccess?.();
        handleClose();
      }
    } catch (err: any) {
      toast({
        title: err.response.data.detail,
        description: err.response.data.detail,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={props.isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogTitle>Check Password</DialogTitle>
        <DialogDescription>
          Please enter your current password to continue.
        </DialogDescription>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={1}
            required
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!password || isLoading}>
              {isLoading ? "Checking…" : "Check"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
