"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneIcon, UserIcon } from "@phosphor-icons/react";
import { InputOTP, Label } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { TextInput } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toast";
import { profileStore } from "@/features/profile/store";
import { useIsDesktop } from "@/hooks/use-media-query";
import { DEMO_OTP, authStore } from "./store";

export type AuthMode = "signin" | "signup";

const signInSchema = z.object({ name: z.string(), phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number.") });
const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number."),
});

type AuthDialogProps = {
  mode: AuthMode | null;
  onClose: () => void;
};

/** Phone + OTP, simulated. Bottom sheet on mobile, centred dialog on desktop. */
export function AuthDialog({ mode, onClose }: AuthDialogProps) {
  const isDesktop = useIsDesktop();
  const router = useRouter();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const signUp = mode === "signup";
  const { control, handleSubmit, getValues, reset } = useForm({
    resolver: zodResolver(signUp ? signUpSchema : signInSchema),
    mode: "onBlur",
    defaultValues: { name: "", phone: "" },
  });

  function close() {
    onClose();
    // Reset after the exit animation so the content doesn't flash.
    window.setTimeout(() => {
      setStep("details");
      setOtp("");
      setOtpError(null);
      setVerifying(false);
      reset();
    }, 300);
  }

  function verify(code = otp) {
    if (code.length < 6) {
      setOtpError("Enter the 6-digit code.");
      return;
    }
    if (code !== DEMO_OTP) {
      setOtpError("That code is not right. Try again.");
      // Clear the field: "complete" only fires when the value reaches six digits again.
      setOtp("");
      return;
    }
    setVerifying(true);
    window.setTimeout(() => {
      const { name, phone } = getValues();
      authStore.set({ signedIn: true });
      if (signUp) profileStore.update((p) => ({ ...p, name: name.trim(), phone }));
      else profileStore.update((p) => ({ ...p, phone }));
      toast.success(signUp ? "Welcome to RideGo" : "Welcome back");
      router.replace("/");
    }, 500);
  }

  const title = step === "otp" ? "Enter the code" : signUp ? "Create your account" : "Sign in";

  const body =
    step === "details" ? (
      <form
        id="auth-form"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(() => {
          setStep("otp");
        })}
      >
        {signUp ? (
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <TextInput
                label="Full name"
                autoComplete="name"
                startIcon={<UserIcon size={20} />}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                isInvalid={fieldState.invalid}
                error={fieldState.error?.message}
              />
            )}
          />
        ) : null}
        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <TextInput
              label="Mobile number"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              description="We will text you a 6-digit code."
              startIcon={<PhoneIcon size={20} />}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              isInvalid={fieldState.invalid}
              error={fieldState.error?.message}
            />
          )}
        />
      </form>
    ) : (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-subtle">
          Sent to <span className="tabular font-semibold text-ink">+91 {getValues().phone}</span>.{" "}
          <button type="button" className="font-semibold text-ink underline underline-offset-2" onClick={() => setStep("details")}>
            Change
          </button>
        </p>
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold">Verification code</Label>
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => {
              setOtp(value);
              setOtpError(null);
            }}
            onComplete={verify}
            inputMode="numeric"
            aria-label="Verification code"
          >
            <InputOTP.Group>
              {[0, 1, 2].map((i) => (
                <InputOTP.Slot key={i} index={i} />
              ))}
            </InputOTP.Group>
            <InputOTP.Separator />
            <InputOTP.Group>
              {[3, 4, 5].map((i) => (
                <InputOTP.Slot key={i} index={i} />
              ))}
            </InputOTP.Group>
          </InputOTP>
          {otpError ? (
            <p className="text-xs text-danger" role="alert">
              {otpError}
            </p>
          ) : (
            <p className="text-xs text-subtle">Preview only: use {DEMO_OTP}.</p>
          )}
        </div>
        <button
          type="button"
          className="min-h-11 self-start text-sm font-semibold underline underline-offset-2"
          onClick={() => toast.info("Code sent again")}
        >
          Resend code
        </button>
      </div>
    );

  const footer =
    step === "details" ? (
      <Button type="submit" form="auth-form" fullWidth size="lg">
        Send code
      </Button>
    ) : (
      <Button fullWidth size="lg" isPending={verifying} onPress={() => verify()}>
        Verify and continue
      </Button>
    );

  const open = mode !== null;
  const onOpenChange = (next: boolean) => !next && close();

  return isDesktop ? (
    <ModalDialog isOpen={open} onOpenChange={onOpenChange} title={title} footer={footer}>
      {body}
    </ModalDialog>
  ) : (
    <BottomSheet isOpen={open} onOpenChange={onOpenChange} title={title} footer={footer}>
      {body}
    </BottomSheet>
  );
}
