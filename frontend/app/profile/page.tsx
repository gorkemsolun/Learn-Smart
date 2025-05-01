"use client";

import { CheckPasswordDialog } from "@/components/check-password-dialog";
import { ManageSubscriptionDialog } from "@/components/manage-subscription-dialog";
import TierCardMini from "@/components/subscription-tier-card-mini-preview";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpgradePlanDialog } from "@/components/upgrade-plan-dialog";
import { userService } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import Cookies from "js-cookie";
import { Calendar, Camera, Pencil, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "../types";
import { Tier } from "../types";

export default function Profile() {
  const [token, setToken] = useState<string>(
    Cookies.get("authToken") as string
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState<boolean>(false);
  const [targetTier, setTargetTier] = useState<Tier>({
    name: "Edux+ Elite",
    price: 199.99,
    billingPeriod: "yearly",
    llm: "GPT-4 Turbo",
    features: [
      "Everything in Pro",
      "Dedicated account manager",
      "Custom integrations",
    ],
    badge: "Best Value",
  });
  const [showUpgradePlanDialog, setShowUpgrade] = useState<boolean>(false);
  const [currentTier, setCurrentTier] = useState<Tier>({
    name: "Edux+ Pro",
    price: 19.99,
    billingPeriod: "monthly",
    llm: "GPT-4",
    features: ["Everything in Basic", "Priority support", "Extra Pro feature"],
    badge: "Popular",
  });
  const [showManageSubscriptionDialog, setShowManageSubscriptionDialog] =
    useState<boolean>(false);
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
      const response = await userService.get("/user", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
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

      const response = await userService.put("/user", {
        user: payload,
      }, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(response.data);
      setOriginalUser(response.data);
      toast({ title: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
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
    if (!dateString) {
      return "";
    }
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
        <div className="border-primary size-8 animate-spin rounded-full border-y-2"></div>
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
          <h1 className="text-foreground text-3xl font-thin tracking-tight">
            Profile
          </h1>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button
                variant="outline"
                onClick={cancelEdit}
                disabled={isSaving}
                className="border-border/50 hover:border-destructive/20 hover:bg-destructive/5 hover:text-destructive gap-2 font-light transition-colors"
              >
                <X className="size-4" /> Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-light shadow-md transition-all hover:shadow-lg"
              >
                {isSaving ? (
                  <>
                    <div className="border-primary-foreground/30 border-t-primary-foreground size-4 animate-spin rounded-full border-2"></div>
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
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-light shadow-md transition-all hover:shadow-lg"
            >
              <Pencil className="size-4" /> Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="border-border/10 from-muted/5 to-muted/10 mb-4 rounded-lg border bg-gradient-to-r p-1 shadow-sm">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-background data-[state=active]:text-primary/90 rounded-md font-light transition-all data-[state=active]:shadow-sm"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="data-[state=active]:bg-background data-[state=active]:text-primary/90 rounded-md font-light transition-all data-[state=active]:shadow-sm"
          >
            Subscription
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="border-border/20 overflow-hidden shadow-sm">
            <div className="from-primary/5 via-secondary/5 to-background h-28 bg-gradient-to-br shadow-lg"></div>
            <div className="relative px-6">
              <div className="-mt-8 flex flex-col items-center gap-6 sm:flex-row sm:items-end">
                <div className="relative">
                  <Avatar className="border-background ring-primary/10 size-32 border-4 shadow-lg ring-2">
                    <AvatarImage
                      src="https://www.w3schools.com/howto/img_avatar.png"
                      alt={user.nickname}
                    />
                    <AvatarFallback className="text-2xl font-light">
                      {user.nickname?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {editMode && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="bg-background hover:bg-primary/10 absolute bottom-0 right-0 size-8 rounded-full shadow-md transition-colors"
                    >
                      <Camera className="size-4" />
                      <span className="sr-only">Change profile picture</span>
                    </Button>
                  )}
                </div>
                <div className="flex-1 pb-4 text-center sm:text-left">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <h2 className="text-foreground text-2xl font-light tracking-tight">
                      {user.nickname}
                    </h2>
                    <Badge
                      variant="outline"
                      className="border-primary/20 bg-primary/5 text-primary/80 self-center font-light sm:self-auto"
                    >
                      {user.role || "Member"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>

            <CardContent className="p-6 pt-0">
              <Separator className="via-border/30 my-6 bg-gradient-to-r from-transparent to-transparent" />

              <div className="bg-muted/5 text-muted-foreground mb-6 flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm">
                <Calendar className="text-primary/60 size-4" />
                <span>Member since {formatDate(user.created_at)}</span>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-foreground/70 text-sm font-light"
                  >
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={user.nickname ?? ""}
                    onChange={(e) =>
                      setUser({ ...user, nickname: e.target.value })
                    }
                    required
                    disabled={!editMode || isSaving}
                    className={
                      editMode
                        ? "border-border/30 bg-muted/20"
                        : "bg-muted/5 focus:bg-muted/10 border-transparent transition-colors"
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-foreground/70 text-sm font-light"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email ?? ""}
                    required
                    disabled
                    className="bg-muted/5 border-transparent transition-colors"
                  />
                </div>

                {editMode && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label
                      htmlFor="password"
                      className="text-foreground/70 text-sm font-light"
                    >
                      New Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={user.password ?? ""}
                      onChange={(e) =>
                        setUser({ ...user, password: e.target.value })
                      }
                      placeholder="********"
                      disabled={isSaving}
                      className="border-primary/30 bg-primary/5 focus:bg-primary/10 transition-colors"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-border/20 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center justify-between font-light">
                  <span>Current Plan</span>
                  <Badge variant="outline" className="font-light">
                    Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <TierCardMini
                  tier={{
                    name: "Edux+ Elite",
                    price: 41.54,
                    billingPeriod: "monthly",
                    llm: "GPT-3.5",
                    features: ["Feature 1", "Feature 2", "Feature 3"],
                  }}
                  fontColor="white"
                />
                <div className="flex flex-col gap-2">
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full font-light transition-colors"
                    onClick={() => setShowUpgrade(true)}
                  >
                    Upgrade Plan
                  </Button>
                  <Button
                    variant="outline"
                    className="border-border/30 hover:bg-muted/10 w-full font-light transition-colors"
                    onClick={() => setShowManageSubscriptionDialog(true)}
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

      {showManageSubscriptionDialog && (
        <ManageSubscriptionDialog
          isOpen={showManageSubscriptionDialog}
          onClose={setShowManageSubscriptionDialog}
          currentPlanName={user.role}
          onUpgrade={(tier) => {
            setUser({ ...user, role: tier.name });
            setShowManageSubscriptionDialog(false);
            toast({
              title: "Success",
              description: `Upgraded to ${tier.name} plan`,
            });
          }}
        />
      )}

      {showUpgradePlanDialog && (
        <UpgradePlanDialog
          isOpen={showUpgradePlanDialog}
          onClose={setShowUpgrade}
          currentTier={currentTier}
          newTier={targetTier}
          onConfirm={() => {
            // TODO: Call the upgrade API here
            /* upgradeApi(targetTier.name).then(() => {
              toast({ title: `Upgraded to ${targetTier.name}!` });
              setCurrentTier(targetTier);
              setShowUpgrade(false);
            }); */
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

      <Card className="border-border/20 overflow-hidden">
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
          <Separator className="bg-border/20 my-6" />

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
