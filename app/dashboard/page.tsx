"use client";

import { useRouter } from "next/navigation";
import Dashboard from "@/components/Dashboard";

export default function DashboardPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push("/");
  };

  return <Dashboard onBack={handleBack} />;
}




