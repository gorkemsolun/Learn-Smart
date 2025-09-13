import SubscriptionComplete from "@/components/subscription/subscription-complete";
import SuspenseWrapper from "@/components/SuspenseWrapper";

export default function Page() {
  return (
    <SuspenseWrapper>
      <SubscriptionComplete />
    </SuspenseWrapper>
  );
}
