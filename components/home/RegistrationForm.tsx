"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserData } from "@/lib/types";

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
}

function Field({ id, label, type = "text", placeholder, value, onChange, error, required }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-invalid={!!error}
        className={cn(
          "w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400",
          "outline-none transition-shadow focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600",
          error ? "border-red-400" : "border-gray-200"
        )}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

type FormErrors = Partial<Record<"firstName" | "lastName" | "email" | "phone", string>>;

function validate(data: { firstName: string; lastName: string; email: string; phone: string }): FormErrors {
  const errors: FormErrors = {};
  if (!data.firstName.trim()) errors.firstName = "First name is required";
  if (!data.lastName.trim()) errors.lastName = "Last name is required";
  if (!data.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email";
  if (!data.phone.trim()) errors.phone = "Phone number is required";
  else if (!/^\+?[\d\s\-()]{7,15}$/.test(data.phone)) errors.phone = "Enter a valid phone number";
  return errors;
}

interface RegistrationFormProps {
  examSlug: string;
}

export default function RegistrationForm({ examSlug }: RegistrationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate({ firstName, lastName, email, phone });

    // Check if this email or phone has already been used for this exam
    const storageKey = `examAttempts_${examSlug}`;
    const used: { email: string; phone: string }[] = (() => {
      try {
        return JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      } catch {
        return [];
      }
    })();

    const emailNorm = email.trim().toLowerCase();
    const phoneNorm = phone.trim().replace(/\s/g, "");

    if (used.some((a) => a.email === emailNorm)) {
      validationErrors.email = "This email has already been used for this exam.";
    }
    if (used.some((a) => a.phone === phoneNorm)) {
      validationErrors.phone = "This phone number has already been used for this exam.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    // Record the attempt so it can't be repeated
    localStorage.setItem(
      storageKey,
      JSON.stringify([...used, { email: emailNorm, phone: phoneNorm }])
    );

    const userData: UserData = { firstName, lastName, email, phone, examSlug };
    sessionStorage.setItem("examUser", JSON.stringify(userData));

    startTransition(() => {
      router.push(`/${examSlug}/instructions`);
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          id="firstName"
          label="First name"
          placeholder="John"
          value={firstName}
          onChange={setFirstName}
          error={errors.firstName}
          required
        />
        <Field
          id="lastName"
          label="Last name"
          placeholder="Doe"
          value={lastName}
          onChange={setLastName}
          error={errors.lastName}
          required
        />
      </div>

      <Field
        id="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={setEmail}
        error={errors.email}
        required
      />

      <Field
        id="phone"
        label="Phone number"
        type="tel"
        placeholder="+91 98765 43210"
        value={phone}
        onChange={setPhone}
        error={errors.phone}
        required
      />

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "w-full rounded-lg bg-blue-700 py-3 text-sm font-semibold text-white transition-colors",
          "hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          "disabled:opacity-70 disabled:cursor-not-allowed"
        )}
      >
        {isPending ? "Registering…" : "Start Exam"}
      </button>

      <p className="text-center text-xs text-gray-500">
        Camera access required. Switching tabs 3 times will auto-submit.
      </p>
    </form>
  );
}
