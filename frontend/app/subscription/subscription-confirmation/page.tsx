import SubscriptionConfirmation from "@/components/subscription/subscription-confirmation";
import SuspenseWrapper from "@/components/SuspenseWrapper";

export default function Page() {
  return (
    <SuspenseWrapper>
      <SubscriptionConfirmation />
    </SuspenseWrapper>
  );
}
