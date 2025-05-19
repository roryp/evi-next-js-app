"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect users from the home page to the Sarcasm Detector page
    router.replace("/sarcasm-detector");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <p>Redirecting...</p>
    </div>
  );
}
