"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRightIcon } from "lucide-react";

import Modal from "@/components/custom/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useUserStore } from "@/lib/user-store";

interface InitModalProps {
  defaultOpen?: boolean;
  isTesting?: boolean;
}

export default function InitModal({
  defaultOpen = true,
  isTesting = false,
}: InitModalProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const setUserProfile = useUserStore((state) => state.setUserProfile);

  const emailValid = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const nameValid = useMemo(() => name.trim().length > 1, [name]);
  const formValid = emailValid && nameValid;

  useEffect(() => {
    if (isTesting) {
      setOpen(false);
    }
  }, [isTesting]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formValid || submitting) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const trimmedName = name.trim();
    const [firstName, ...lastNameParts] = trimmedName.split(/\s+/);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName: lastNameParts.join(" "),
          list_N: 2,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Subscription failed. Please try again.");
      }

      setUserProfile({ email, firstName, lastName: lastNameParts.join(" ") });
      setMessage("Thanks! You're in.");
      setOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Subscription failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      backHref="https://toponefutures.com"
      modalDescription="Let's get your trading account set up"
    >
      <div className="flex flex-col items-center gap-4">
        <Image src="/images/tof-logo-dark.png" alt="Top One Futures" width={335} height={96} className="w-auto h-[50px]" />
        <h2 className="text-2xl font-bold text-gray-900 md:text-3xl leading-none mt-4 max-w-[360px]">
          Let&apos;s get your trading account set up
        </h2>
        <h4 className="text-base font-medium text-gray-900 max-w-[360px]">
          Enter your information below
        </h4>
        {/* <Link href="#" className="text-sm font-medium text-gray-700 underline underline-offset-4">
          Have an account? Log In
        </Link> */}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-[400px] px-2 mx-auto">
        <Input
          placeholder="Enter your first name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900"
          aria-invalid={!nameValid && name.length > 0}
        />
        <Input
          placeholder="Enter your email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900"
          aria-invalid={!emailValid && email.length > 0}
        />
        <Button
          type="submit"
          size="lg"
          className="w-full font-bold h-12 white-glow bg-dark-gray text-white hover:bg-dark-gray/90"
          variant="primary"
          disabled={!formValid || submitting}
        >
          {submitting ? "Loading..." : "Continue to checkout"}
          {submitting ? (
            <Spinner />
          ) : (
            <span className="bg-white text-black py-[2px] px-3 rounded-full">
              <ArrowRightIcon className="tof-arrow-float-x -translate-y-[1.5px]" />
            </span>
          )}
        </Button>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-gray-500">🔒 Secure checkout · Trusted By 13,000+ Funded Traders</p>
          <p className="text-xs text-gray-500">⭐⭐⭐⭐⭐ 3,000+ 5-Star Reviews on Trustpilot</p>
        </div>
        {message ? <p className="text-sm text-gray-600">{message}</p> : null}
      </form>
    </Modal>
  );
}
