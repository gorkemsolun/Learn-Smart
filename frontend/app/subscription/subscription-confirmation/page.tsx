"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, Calendar, LockKeyhole, ArrowLeft, Loader2 } from "lucide-react";
import TierCardMini from "@/components/subscription-tier-card-mini-preview";
import {backendAPI} from "@/environment/backend_api";
import Cookies from "js-cookie";

const steps = [
  { step: "STEP 1", title: "Tier Plan", status: "complete" },
  { step: "STEP 2", title: "Confirmation", status: "current" },
  { step: "STEP 3", title: "Complete", status: "upcoming" },
];

type CardInfo = {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
};

type Errors = Partial<CardInfo>;

export default function SubscriptionConfirmation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tierParam = searchParams.get("tier");
  const tier = tierParam ? JSON.parse(decodeURIComponent(tierParam)) : null;
  const token = Cookies.get("authToken") as string;
  
  const [cardInfo, setCardInfo] = useState<CardInfo>({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [autoSubscribe, setAutoSubscribe] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cardNumber") {
      formattedValue = value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})/g, "$1-").replace(/-$/, "");
    }

    if (name === "expiryDate") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4);
      if (formattedValue.length > 2) {
        const month = parseInt(formattedValue.slice(0, 2), 10);
        const year = parseInt(formattedValue.slice(2, 4), 10);
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;

        if (month < 1 || month > 12) {
          formattedValue = "";
        }
        else if(formattedValue.length == 4 && (year < currentYear || (year <= currentYear && month < currentMonth))) {
          formattedValue = "";
        }
        else {
          formattedValue = `${formattedValue.slice(0, 2)}/${formattedValue.slice(2)}`;
        }
      }
    }

    if (name === "cvv") {
      formattedValue = value.replace(/\D/g, "").slice(0, 3);
    }

    if (name === "cardName") {
      formattedValue = value
        .toUpperCase()
        .replace(/[^\p{L}\s!"#$%&'()*+,./:;<=>?@[\\\]^_-]/gu, "");
    }

    setCardInfo((prev) => ({ ...prev, [name]: formattedValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors: Errors = {};
    if (!/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(cardInfo.cardNumber)) {
      newErrors.cardNumber = "Please enter a valid 16-digit card number";
    }
    if (!cardInfo.cardName.trim()) {
      newErrors.cardName = "Name on card is required";
    }
    if (!/^\d{2}\/\d{2}$/.test(cardInfo.expiryDate)) {
      newErrors.expiryDate = "Please enter a valid expiry date (MM/YY)";
    }
    if (!/^\d{3}$/.test(cardInfo.cvv)) {
      newErrors.cvv = "Please enter a valid 3-digit CVV";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (validateForm() && agreedToTerms) {
      setIsSubmitting(true);

      // TO-DO handle banking logic

      const data = {
        subscription_tier: tier.key,
        subscription_duration: tier.billingPeriod,
        auto_renew: autoSubscribe
      };

      try {
        await backendAPI.post(`/subscriptions/log`, data, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("Error creating subscription:", error);
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        router.push("/subscription/subscription-complete?status=success");
      } catch (error) {
        console.error("Error processing payment:", error);
        router.push("/subscription/subscription-complete?status=failure");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!tier) {
    return <div>No tier information found.</div>;
  }

  return (
    <div className="flex grow flex-col items-center justify-center bg-background p-6 font-thin">
      <OnboardingProgress steps={steps} />
      <div className="mx-auto mt-2 grid w-full max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="w-full overflow-hidden shadow-lg lg:col-span-2">
          <div className="bg-primary p-6 text-primary-foreground">
            <h2 className="text-2xl">Payment Information</h2>
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cardNumber" className="font-light">Card Number</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                  <Input
                      id="cardNumber"
                      name="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardInfo.cardNumber}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                  />
                </div>
                {errors.cardNumber && <p className="text-sm text-destructive">{errors.cardNumber}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardName" className="font-light">Name on Card</Label>
                <Input
                    id="cardName"
                    name="cardName"
                    placeholder="J. P. MORGAN"
                    value={cardInfo.cardName}
                    onChange={handleInputChange}
                    required
                />
                {errors.cardName && <p className="text-sm text-destructive">{errors.cardName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate" className="font-light">Expiry Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                    <Input
                        id="expiryDate"
                        name="expiryDate"
                        placeholder="MM/YY"
                        value={cardInfo.expiryDate}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                    />
                  </div>
                  {errors.expiryDate && <p className="text-sm text-destructive">{errors.expiryDate}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv" className="font-light">CVV</Label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                    <Input
                        id="cvv"
                        name="cvv"
                        placeholder="123"
                        value={cardInfo.cvv}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                    />
                  </div>
                  {errors.cvv && <p className="text-sm text-destructive">{errors.cvv}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={setAgreedToTerms}/>
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    I agree to the{" "}
                    <a href="#" className="text-primary hover:underline">
                      terms and conditions
                    </a>
                  </label>
                </div>
                {tier.billingPeriod === "monthly" ? (
                  <div className="flex items-center space-x-2">
                    <Checkbox id="auto-subscribe" checked={autoSubscribe} onCheckedChange={setAutoSubscribe} />
                    <label htmlFor="auto-subscribe" className="text-sm text-muted-foreground">
                      Auto Renew
                    </label>
                  </div>
                ) : null}
              </div>
              <div className="flex items-center justify-between">
                <Button type="button" variant="outline" onClick={() => router.back()}
                        className="flex items-center font-light">
                  <ArrowLeft className="mr-2 size-4"/> Back
                </Button>
                <Button type="submit" className="w-1/2 font-light" disabled={isSubmitting || !agreedToTerms}>
                  {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin"/>
                        Processing...
                      </>
                  ) : (
                      "Confirm Payment"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="w-full bg-primary p-6 text-primary-foreground shadow-lg">
            <h3 className="mb-4 text-xl">Order Summary</h3>
            <TierCardMini tier={tier}/>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subscription Price</span>
                <span>${tier.price}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${(tier.price * 0.1).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-primary-foreground/20 pt-2 text-lg font-semibold">
                <span>Total</span>
                <span>${(tier.price * 1.1).toFixed(2)}</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-primary-foreground/80">
              By confirming your subscription, you allow Edux to charge your card for this payment and future
              payments in accordance with their terms.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

