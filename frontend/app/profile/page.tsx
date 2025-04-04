"use client";

import { CheckPasswordDialog } from "@/components/check-password-dialog";
import TierCardMini from "@/components/subscription-tier-card-mini-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { backendAPI } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import type { User } from "../types";
import { Calendar, Camera, Pencil, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export default function Profile() {
  const [token, setToken] = useState<string>(Cookies.get("authToken") as string);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState<boolean>(false);
  const [user, setUser] = useState<User>({
    user_id: "",
    role: "",
    nickname: "",
    email: "",
    password: "",
    created_at: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchUserData() {
    setIsLoading(true);
    try {
      const response = await backendAPI.get("/users/me", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching profile",
        description: "Failed to fetch user data.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveProfile() {
    setIsLoading(true);

    if (!user.nickname.trim() || !user.email.trim()) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all required fields.",
      });
      setIsLoading(false);
      return;
    }

    try {
      let payload: { email: string; nickname: string; password?: string };

      if (user.password) {
        payload = {
          nickname: user.nickname,
          email: user.email,
          password: user.password,
        };
      } else {
        payload = {
          nickname: user.nickname,
          email: user.email,
        };
      }

      const response = await backendAPI.put("/users/update", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(response.data);
      setOriginalUser(response.data);
      toast({ title: "Profile updated successfully" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: "An error occurred while updating your profile.",
      });
    } finally {
      setIsLoading(false);
      setEditMode(false);
    }
  }

  function cancelEdit() {
    if (originalUser) {
      setUser(originalUser);
    }
    setEditMode(false);
  }

  function formatDate(dateString: string) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  const isSaving = isLoading;

  if (isLoading && !user.user_id) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-y-2 border-primary"></div>
      </div>
    );
  }

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-2 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-thin tracking-tight text-foreground">Profile</h1>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button
                variant="outline"
                onClick={cancelEdit}
                disabled={isSaving}
                className="gap-2 border-border/50 font-thin transition-colors hover:border-destructive/20 hover:bg-destructive/5 hover:text-destructive"
              >
                <X className="size-4" /> Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="gap-2 bg-primary font-thin text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
              >
                {isSaving ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-4" /> Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setShowPasswordDialog(true)}
              variant="default"
              className="gap-2 bg-primary font-thin text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
            >
              <Pencil className="size-4" /> Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4 rounded-lg border border-border/10 bg-gradient-to-r from-muted/5 to-muted/10 p-1 shadow-sm">
          <TabsTrigger
            value="profile"
            className="rounded-md font-thin transition-all data-[state=active]:bg-background data-[state=active]:text-primary/90 data-[state=active]:shadow-sm"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="rounded-md font-thin transition-all data-[state=active]:bg-background data-[state=active]:text-primary/90 data-[state=active]:shadow-sm"
          >
            Subscription
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="overflow-hidden border-border/20 shadow-sm">
            <div className="h-28 bg-gradient-to-br from-primary/5 via-secondary/5 to-background shadow-lg"></div>
            <div className="relative px-6">
              <div className="-mt-8 flex flex-col items-center gap-6 sm:flex-row sm:items-end">
                <div className="relative">
                  <Avatar className="size-32 border-4 border-background shadow-lg ring-2 ring-primary/10">
                    <AvatarImage src="https://www.w3schools.com/howto/img_avatar.png" alt={user.nickname} />
                    <AvatarFallback className="text-2xl font-thin">
                      {user.nickname?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {editMode && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 size-8 rounded-full bg-background shadow-md transition-colors hover:bg-primary/10"
                    >
                      <Camera className="size-4" />
                      <span className="sr-only">Change profile picture</span>
                    </Button>
                  )}
                </div>
                <div className="flex-1 pb-4 text-center sm:text-left">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <h2 className="text-2xl font-thin tracking-tight text-foreground">{user.nickname}</h2>
                    <Badge
                      variant="outline"
                      className="self-center border-primary/20 bg-primary/5 font-thin text-primary/80 sm:self-auto"
                    >
                      {user.role || "Member"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>

            <CardContent className="p-6 pt-0">
              <Separator className="my-6 bg-gradient-to-r from-transparent via-border/30 to-transparent" />

              <div className="mb-6 flex w-fit items-center gap-2 rounded-full bg-muted/5 px-3 py-1.5 text-sm text-muted-foreground">
                <Calendar className="size-4 text-primary/60" />
                <span>Member since {formatDate(user.created_at)}</span>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-thin text-foreground/70">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={user.nickname ?? ""}
                    onChange={(e) => setUser({ ...user, nickname: e.target.value })}
                    required
                    disabled={!editMode || isSaving}
                    className={
                      editMode
                        ? "border-border/30 bg-muted/20"
                        : "border-transparent bg-muted/5 transition-colors focus:bg-muted/10"
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-thin text-foreground/70">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email ?? ""}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                    required
                    disabled={!editMode || isSaving}
                    className={
                      editMode
                        ? "border-border/30 bg-muted/20"
                        : "border-transparent bg-muted/5 transition-colors focus:bg-muted/10"
                    }
                  />
                </div>

                {editMode && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="password" className="text-sm font-thin text-foreground/70">
                      New Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={user.password ?? ""}
                      onChange={(e) => setUser({ ...user, password: e.target.value })}
                      placeholder="********"
                      disabled={isSaving}
                      className="border-primary/30 bg-primary/5 transition-colors focus:bg-primary/10"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="overflow-hidden border-border/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between font-thin text-foreground">
                  <span>Current Plan</span>
                  <Badge variant="outline" className="font-thin">
                    Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-xl border border-border/20 bg-gradient-to-br from-primary/5 via-secondary/5 to-background p-4 shadow-lg">
                  <TierCardMini
                    tier={{
                      name: "Edux+ Elite",
                      price: 41.54,
                      billingPeriod: "monthly",
                      llm: "GPT-3.5",
                      features: ["Feature 1", "Feature 2", "Feature 3"],
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button className="w-full bg-primary font-thin text-primary-foreground transition-colors hover:bg-primary/90">
                    Upgrade Plan
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-border/30 font-thin transition-colors hover:bg-muted/10"
                  >
                    Manage Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {showPasswordDialog && (
        <CheckPasswordDialog
          isOpen={showPasswordDialog}
          onClose={() => setShowPasswordDialog(false)}
          onCheckSuccess={() => {
            setOriginalUser(user);
            setEditMode(true);
            setShowPasswordDialog(false);
          }}
        />
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="mb-6">
        <Skeleton className="h-10 w-64" />
      </div>

      <Card className="overflow-hidden border-border/20">
        <Skeleton className="h-32 w-full" />
        <div className="relative px-6">
          <div className="-mt-16 flex flex-col items-center gap-6 sm:flex-row sm:items-end">
            <Skeleton className="size-32 rounded-full" />
            <div className="flex-1 pb-4 text-center sm:text-left">
              <Skeleton className="mb-2 h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>

        <CardContent className="p-6 pt-0">
          <Separator className="my-6 bg-border/20" />

          <Skeleton className="mb-6 h-4 w-48" />

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
