"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { create } from "zustand"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { CircleCheckIcon } from "lucide-react"

type LoginModalStep = "email" | "otp" | "success"

type LoginModalStore = {
  open: boolean
  setOpen: (open: boolean) => void
  openModal: () => void
  closeModal: () => void
}

export const useLoginModalStore = create<LoginModalStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  openModal: () => set({ open: true }),
  closeModal: () => set({ open: false }),
}))

export default function LoginModal() {
  const open = useLoginModalStore((state) => state.open)
  const setOpen = useLoginModalStore((state) => state.setOpen)
  const router = useRouter()

  const [step, setStep] = useState<LoginModalStep>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [requestingOtp, setRequestingOtp] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [serviceWarning, setServiceWarning] = useState<string | null>(null)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const lastAttemptedOtpRef = useRef<string | null>(null)

  const emailValid = useMemo(() => /\S+@\S+\.\S+/.test(email), [email])

  useEffect(() => {
    if (!open) {
      setStep("email")
      setEmail("")
      setOtp("")
      setRequestingOtp(false)
      setRequestError(null)
      setServiceWarning(null)
      setVerifyingOtp(false)
      setVerifyError(null)
      lastAttemptedOtpRef.current = null
    }
  }, [open])

  useEffect(() => {
    if (step !== "otp") {
      lastAttemptedOtpRef.current = null
    }
  }, [step])

  useEffect(() => {
    if (step !== "otp") {
      return
    }

    if (!/^\d{6}$/.test(otp)) {
      return
    }

    if (lastAttemptedOtpRef.current === otp) {
      return
    }

    lastAttemptedOtpRef.current = otp

    const controller = new AbortController()

    ;(async () => {
      setVerifyingOtp(true)
      setVerifyError(null)

      try {
        const response = await fetch("/api/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
          signal: controller.signal,
        })

        if (response.status === 401) {
          setVerifyError("Incorrect code. Please try again.")
          setOtp("")
          lastAttemptedOtpRef.current = null
          return
        }

        if (!response.ok) {
          setVerifyError(null)
          setEmail("")
          setOtp("")
          setStep("email")
          setServiceWarning("Service failed. Please try again.")
          lastAttemptedOtpRef.current = null
          return
        }

        setStep("success")
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }

        setVerifyError(null)
        setEmail("")
        setOtp("")
        setStep("email")
        setServiceWarning("Service failed. Please try again.")
        lastAttemptedOtpRef.current = null
      } finally {
        if (!controller.signal.aborted) {
          setVerifyingOtp(false)
        }
      }
    })()

    return () => {
      controller.abort()
      lastAttemptedOtpRef.current = null
    }
  }, [email, otp, step])

  const handleGetOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!emailValid) {
      return
    }

    setRequestingOtp(true)
    setRequestError(null)
    setServiceWarning(null)

    try {
      const response = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? "Failed to request OTP")
      }

      setStep("otp")
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Failed to request OTP")
    } finally {
      setRequestingOtp(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="w-[96vw] max-w-[380px]! rounded-2xl border border-white/10 bg-dark p-6 text-white shadow-2xl"
        showCloseButton
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-semibold flex items-center justify-center">
            <Image src="/images/tof-logo.png" alt="Top One Futures" width={669} height={192} className="w-40" />
          </DialogTitle>
          {step === "email" ? (
            <DialogDescription className="text-white/70 text-center">
              Enter your email and we&apos;ll send you a one-time passcode that will allow you to log in.
            </DialogDescription>
          ) : (
            <DialogDescription className="text-white/70 text-center">
              Enter the 6-digit code we sent to <span className="font-semibold text-white">{email}</span>.
            </DialogDescription>
          )}
        </DialogHeader>

        {step === "email" ? (
          <form onSubmit={handleGetOtp} className="flex flex-col gap-4">
            <Input
              placeholder="Enter your email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/50 text-center"
              aria-invalid={!emailValid && email.length > 0}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold"
              disabled={!emailValid || requestingOtp}
            >
              {requestingOtp ? "Requesting..." : "Get OTP"}
            </Button>
            {requestError ? <p className="text-sm text-red-300">{requestError}</p> : null}
            {serviceWarning ? <p className="text-sm text-yellow-200">{serviceWarning}</p> : null}
          </form>
        ) : step === "otp" ? (
          <div className="flex flex-col gap-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-12 w-12 border border-white/10 bg-white/5 text-white" />
                  <InputOTPSlot index={1} className="h-12 w-12 border border-white/10 bg-white/5 text-white" />
                  <InputOTPSlot index={2} className="h-12 w-12 border border-white/10 bg-white/5 text-white" />
                </InputOTPGroup>
                <InputOTPSeparator className="text-white/60" />
                <InputOTPGroup>
                  <InputOTPSlot index={3} className="h-12 w-12 border border-white/10 bg-white/5 text-white" />
                  <InputOTPSlot index={4} className="h-12 w-12 border border-white/10 bg-white/5 text-white" />
                  <InputOTPSlot index={5} className="h-12 w-12 border border-white/10 bg-white/5 text-white" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex gap-4 items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setOtp("")
                  setVerifyError(null)
                  setStep("email")
                }}
              >
                Change email
              </Button>
              <p className="text-xs text-white/60">
                {verifyingOtp ? "Verifying..." : "Code submits automatically when complete."}
              </p>
            </div>

            {verifyError ? <p className="text-sm text-red-300">{verifyError}</p> : null}
          </div>
        ) : (
          <div className="flex flex-col gap-6 items-center text-center">
            <div className="flex flex-col items-center gap-3">
              <CircleCheckIcon className="h-12 w-12 text-neon-green" />
              <h3 className="text-xl font-semibold">You&apos;re logged in</h3>
              <p className="text-sm text-white/70">Your code was verified successfully.</p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <Button
                variant="primary"
                size="lg"
                className="w-full font-bold"
                onClick={() => {
                  setOpen(false)
                  router.push("/")
                }}
              >
                Continue
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full font-bold"
                onClick={() => {
                  setOpen(false)
                  router.push("/account")
                }}
              >
                Go to account
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
