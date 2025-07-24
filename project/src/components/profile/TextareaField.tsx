"use client";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Control, FieldValues, Path } from "react-hook-form";
import { LucideIcon } from "lucide-react";
import { useSession } from "next-auth/react"; // Import useSession

interface TextareaFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder: string;
  Icon: LucideIcon;
}

export function TextareaField<T extends FieldValues>({ control, name, label, placeholder, Icon }: TextareaFieldProps<T>) {
  const { data: session } = useSession(); // Use useSession
  const isTalent = session?.user?.role === "talent";

  // Define colors based on role
  const labelIconColor = isTalent ? "text-[#8DBCC7]" : "text-[#4CAF50]";
  const textareaBgBorderFocus = isTalent
    ? "bg-[#A4CCD9]/20 border-[#90D1CA] focus:ring-[#8DBCC7] focus:border-[#8DBCC7]"
    : "bg-[#A5D6A7]/20 border-[#1B5E20] focus:ring-[#4CAF50] focus:border-[#4CAF50]";

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[#212121] font-semibold text-base flex items-center">
            <Icon className={`mr-3 h-5 w-5 ${labelIconColor}`} /> {label}
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              {...field}
              value={field.value || ""}
              className={`text-[#212121] placeholder-[#757575] rounded-lg p-3 w-full min-h-[100px] transition-all duration-200 ${textareaBgBorderFocus}`}
            />
          </FormControl>
          <FormMessage className="text-red-600 text-sm mt-2" />
        </FormItem>
      )}
    />
  );
}