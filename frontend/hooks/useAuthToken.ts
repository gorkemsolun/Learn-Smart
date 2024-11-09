// useAuthToken.ts
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export const useAuthToken = () => {
  const [token, setToken] = useState<string>(Cookies.get("authToken") || "");

  useEffect(() => {
    setToken(Cookies.get("authToken") || "");
  }, []);

  return token;
};