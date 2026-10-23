"use client";

import { Description, FieldError, Input, Label, TextArea, TextField, type TextFieldProps } from "@heroui/react";
import { cn } from "@/lib/cn";

type TextInputProps = Omit<TextFieldProps, "children"> & {
  label: string;
  placeholder?: string;
  description?: string;
  error?: string;
  startIcon?: React.ReactNode;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
};

export function TextInput({
  label,
  placeholder,
  description,
  error,
  startIcon,
  inputMode,
  autoComplete,
  className,
  ...props
}: TextInputProps) {
  return (
    <TextField className={cn("flex flex-col gap-2", className)} {...props}>
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="relative">
        {startIcon ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-subtle"
          >
            {startIcon}
          </span>
        ) : null}
        <Input
          fullWidth
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          className={cn(startIcon && "pl-10")}
        />
      </div>
      {description ? <Description className="text-xs text-subtle">{description}</Description> : null}
      <FieldError className="text-xs text-danger">{error}</FieldError>
    </TextField>
  );
}

type TextAreaInputProps = Omit<TextFieldProps, "children"> & {
  label: string;
  placeholder?: string;
  description?: string;
  error?: string;
  rows?: number;
};

export function TextAreaInput({ label, placeholder, description, error, rows = 5, className, ...props }: TextAreaInputProps) {
  return (
    <TextField className={cn("flex flex-col gap-2", className)} {...props}>
      <Label className="text-sm font-semibold">{label}</Label>
      <TextArea fullWidth rows={rows} placeholder={placeholder} className="min-h-28 rounded-control text-base leading-6" />
      {description ? <Description className="text-xs text-subtle">{description}</Description> : null}
      <FieldError className="text-xs text-danger">{error}</FieldError>
    </TextField>
  );
}
