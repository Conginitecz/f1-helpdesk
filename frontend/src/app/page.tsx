"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    router.replace(session ? `/${session.user.role.replace("_", "-")}` : "/login");
  }, [router]);

  return (
    <main className="route-loading" aria-live="polite">Opening F1 Help Desk…</main>
  );
}
