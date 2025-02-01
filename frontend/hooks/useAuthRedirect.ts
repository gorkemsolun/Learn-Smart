import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthToken } from "@/hooks/useAuthToken";

export const useAuthRedirect = () => {
  const token = useAuthToken();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  return token;
};