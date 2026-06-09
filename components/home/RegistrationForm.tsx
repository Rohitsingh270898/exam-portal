"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserData } from "@/lib/types";
import { ChevronDown, Search, Globe } from "lucide-react";

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
    <div className="flex flex-col sm:gap-1.5 gap-1">
      <label htmlFor={id} className="sm:text-sm text-[12px] font-medium text-gray-700">
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
          "w-full rounded-lg border px-3.5 py-2.5 text-[16px] text-gray-900 placeholder:text-gray-400",
          "outline-none transition-shadow focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600",
          error ? "border-red-400" : "border-gray-200"
        )}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  minLength: number;
  maxLength: number;
  placeholder: string;
}

const COUNTRIES: Country[] = [
  { name: "India", code: "IN", dialCode: "+91", flag: "in", minLength: 10, maxLength: 10, placeholder: "98765 43210" },
  { name: "Nepal", code: "NP", dialCode: "+977", flag: "np", minLength: 10, maxLength: 10, placeholder: "985 1012345" },
  { name: "United Arab Emirates (Dubai)", code: "AE", dialCode: "+971", flag: "ae", minLength: 9, maxLength: 9, placeholder: "50 123 4567" },
  { name: "United States", code: "US", dialCode: "+1", flag: "us", minLength: 10, maxLength: 10, placeholder: "201 555 0123" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "gb", minLength: 10, maxLength: 10, placeholder: "7700 900077" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "sa", minLength: 9, maxLength: 9, placeholder: "50 123 4567" },
  { name: "Singapore", code: "SG", dialCode: "+65", flag: "sg", minLength: 8, maxLength: 8, placeholder: "8123 4567" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "ca", minLength: 10, maxLength: 10, placeholder: "204 555 0123" },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "au", minLength: 9, maxLength: 9, placeholder: "412 345 678" },
  { name: "Bangladesh", code: "BD", dialCode: "+880", flag: "bd", minLength: 10, maxLength: 10, placeholder: "1712 345678" },
  { name: "Sri Lanka", code: "LK", dialCode: "+94", flag: "lk", minLength: 9, maxLength: 9, placeholder: "71 234 5678" },
  { name: "Malaysia", code: "MY", dialCode: "+60", flag: "my", minLength: 9, maxLength: 10, placeholder: "12 345 6789" },
  { name: "Qatar", code: "QA", dialCode: "+974", flag: "qa", minLength: 8, maxLength: 8, placeholder: "3333 4444" },
  { name: "Oman", code: "OM", dialCode: "+968", flag: "om", minLength: 8, maxLength: 8, placeholder: "9123 4567" },
  { name: "Kuwait", code: "KW", dialCode: "+965", flag: "kw", minLength: 8, maxLength: 8, placeholder: "5123 4567" },
  { name: "Bahrain", code: "BH", dialCode: "+973", flag: "bh", minLength: 8, maxLength: 8, placeholder: "3123 4567" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "de", minLength: 10, maxLength: 11, placeholder: "151 23456789" },
  { name: "France", code: "FR", dialCode: "+33", flag: "fr", minLength: 9, maxLength: 9, placeholder: "6 1234 5678" },
  { name: "South Africa", code: "ZA", dialCode: "+27", flag: "za", minLength: 9, maxLength: 9, placeholder: "82 123 4567" },
  { name: "Nigeria", code: "NG", dialCode: "+234", flag: "ng", minLength: 10, maxLength: 10, placeholder: "803 123 4567" },
  { name: "Kenya", code: "KE", dialCode: "+254", flag: "ke", minLength: 9, maxLength: 9, placeholder: "712 345678" },
  { name: "Indonesia", code: "ID", dialCode: "+62", flag: "id", minLength: 9, maxLength: 12, placeholder: "812 3456 7890" },
  { name: "Other", code: "OTHER", dialCode: "+", flag: "globe", minLength: 7, maxLength: 15, placeholder: "Enter phone number" }
];

type FormErrors = Partial<Record<"firstName" | "lastName" | "email" | "phone", string>>;

function validate(
  data: { firstName: string; lastName: string; email: string },
  phoneDigits: string,
  country: Country
): FormErrors {
  const errors: FormErrors = {};
  if (!data.firstName.trim()) errors.firstName = "First name is required";
  if (!data.lastName.trim()) errors.lastName = "Last name is required";
  if (!data.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email";

  const digitsOnly = phoneDigits.replace(/\D/g, "");
  if (!digitsOnly) {
    errors.phone = "Phone number is required";
  } else if (digitsOnly.length < country.minLength || digitsOnly.length > country.maxLength) {
    if (country.minLength === country.maxLength) {
      errors.phone = `${country.name} phone number must be exactly ${country.minLength} digits`;
    } else {
      errors.phone = `${country.name} phone number must be between ${country.minLength} and ${country.maxLength} digits`;
    }
  }
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
  const [phoneDigits, setPhoneDigits] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const filteredCountries = COUNTRIES.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.dialCode.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate({ firstName, lastName, email }, phoneDigits, selectedCountry);

    const phone = selectedCountry.dialCode === "+"
      ? `+${phoneDigits}`
      : `${selectedCountry.dialCode} ${phoneDigits}`;

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

    const isIideEmail = emailNorm.endsWith("@iide.co");

    if (!isIideEmail) {
      if (used.some((a) => a.email === emailNorm)) {
        validationErrors.email = "This email has already been used for this exam.";
      }
      if (used.some((a) => a.phone === phoneNorm)) {
        validationErrors.phone = "This phone number has already been used for this exam.";
      }
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
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 sm:gap-5">
      <div className="sm:grid grid-cols-1 flex sm:grid-cols-2 gap-4">
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

      <div className="flex flex-col sm:gap-1.5 gap-1 relative">
        <label htmlFor="phone" className="sm:text-sm text-[12px] font-medium text-gray-700">
          Phone number
        </label>
        <div className="relative flex items-stretch">
          {/* Flag & Dial Code Selector */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 border border-gray-200 border-r-0 rounded-l-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 focus-visible:border-blue-600 cursor-pointer select-none",
              errors.phone && "border-red-400"
            )}
            style={{ minWidth: "90px" }}
          >
            {selectedCountry.code === "OTHER" ? (
              <Globe className="size-4.5 text-gray-400 shrink-0" />
            ) : (
              <img
                src={`https://flagcdn.com/w40/${selectedCountry.flag}.png`}
                alt={selectedCountry.name}
                className="w-5 h-3.5 object-cover rounded-[1px] border border-gray-100 shadow-sm shrink-0"
              />
            )}
            <span className="text-[14px] font-medium text-gray-700">{selectedCountry.dialCode}</span>
            <ChevronDown className="size-3.5 text-gray-400 shrink-0" />
          </button>

          {/* Phone digits input */}
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={selectedCountry.placeholder}
            value={phoneDigits}
            onChange={(e) => {
              // Only allow digits
              const numericValue = e.target.value.replace(/\D/g, "");
              // Limit to country maxLength
              const truncated = numericValue.slice(0, selectedCountry.maxLength);
              setPhoneDigits(truncated);
            }}
            required
            className={cn(
              "w-full rounded-r-lg border px-3.5 py-2.5 text-[16px] text-gray-900 placeholder:text-gray-400",
              "outline-none transition-shadow focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600",
              errors.phone ? "border-red-400 border-l-0" : "border-gray-200 border-l-0"
            )}
          />
        </div>
        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}

        {/* Dropdown overlay */}
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className="absolute left-0 top-[calc(100%+6px)] z-50 w-[300px] rounded-xl border border-gray-100 bg-white/95 backdrop-blur-md p-2 shadow-2xl ring-1 ring-black/5 flex flex-col focus:outline-none"
          >
            {/* Search filter input */}
            <div className="relative mb-2 shrink-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search country or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                autoFocus
              />
            </div>

            {/* Scrollable List */}
            <div className="overflow-y-auto max-h-[220px] flex-1 divide-y divide-gray-100/50 pr-1">
              {filteredCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setSelectedCountry(c);
                    setIsDropdownOpen(false);
                    setSearchQuery("");
                    // Adjust existing phone digits length if it exceeds the new country's limit
                    setPhoneDigits((prev) => prev.slice(0, c.maxLength));
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded-md transition-colors cursor-pointer select-none",
                    selectedCountry.code === c.code
                      ? "bg-blue-50 text-blue-900 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {c.code === "OTHER" ? (
                    <Globe className="size-4.5 text-gray-400 shrink-0" />
                  ) : (
                    <img
                      src={`https://flagcdn.com/w40/${c.flag}.png`}
                      alt={c.name}
                      className="w-5 h-3.5 object-cover rounded-[2px] border border-gray-100 shadow-sm shrink-0"
                    />
                  )}
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-gray-400 text-xs font-mono shrink-0">{c.dialCode}</span>
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <div className="py-4 text-center text-xs text-gray-400">
                  No countries found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
