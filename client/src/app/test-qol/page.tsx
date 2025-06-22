"use client";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { useToast } from "../../components/toast-provider";
import LoadingOverlay from "../../components/loading-overlay";
import Link from "next/link";

export default function TestQolPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  return (
    <div className="max-w-xl mx-auto py-12 flex flex-col gap-6 items-center">
      <h1 className="text-2xl font-bold mb-4">QoL Test Page</h1>
      <Button
        data-testid="toast-success-btn"
        onClick={() => showToast({ title: "Success!", description: "This is a success toast.", variant: "success" })}
      >
        Show Success Toast
      </Button>
      <Button
        data-testid="toast-error-btn"
        variant="destructive"
        onClick={() => showToast({ title: "Error!", description: "This is an error toast.", variant: "error" })}
      >
        Show Error Toast
      </Button>
      <Button
        data-testid="loading-btn"
        variant="outline"
        onClick={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 2000);
        }}
      >
        Show Loading Spinner
      </Button>
      <Link href="/thispagedoesnotexist" data-testid="404-link" className="underline text-blue-600 mt-4">
        Go to 404 Page
      </Link>
      {loading && <LoadingOverlay />}
    </div>
  );
} 