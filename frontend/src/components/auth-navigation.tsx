"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AuthNavigation() {
  const router = useRouter();

  useEffect(() => {
    const goToLogin = () => router.replace("/login");
    window.addEventListener("f1-unauthorized", goToLogin);
    return () => window.removeEventListener("f1-unauthorized", goToLogin);
  }, [router]);

  return null;
}
