"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control, FieldValues, Path } from "react-hook-form";
import { LucideIcon } from "lucide-react";
import { useSession } from "next-auth/react"; // Import useSession

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder: string;
  options: SelectOption[];
  Icon: LucideIcon;
}

export function SelectField<T extends FieldValues>({ control, name, label, placeholder, options, Icon }: SelectFieldProps<T>) {
  const { data: session } = useSession(); // Use useSession
  const isTalent = session?.user?.role === "talent";

  // Define colors based on role
  const labelIconColor = isTalent ? "text-[#8DBCC7]" : "text-[#4CAF50]";
  const selectTriggerBgBorderFocus = isTalent
    ? "bg-[#A4CCD9]/20 border-[#90D1CA] focus:ring-[#8DBCC7] focus:border-[#8DBCC7]"
    : "bg-[#A5D6A7]/20 border-[#1B5E20] focus:ring-[#4CAF50] focus:border-[#4CAF50]";
  const selectItemHover = isTalent ? "hover:bg-[#A4CCD9]/30" : "hover:bg-[#A5D6A7]/30";
  const selectContentBorder = isTalent ? "border-[#90D1CA]" : "border-[#1B5E20]";

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
            <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
              <SelectTrigger className={`text-[#212121] rounded-lg p-3 w-full transition-all duration-200 ${selectTriggerBgBorderFocus}`}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent className={`bg-white text-[#212121] rounded-lg shadow-lg ${selectContentBorder}`}>
                {options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className={`${selectItemHover} cursor-pointer`}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage className="text-red-600 text-sm mt-2" />
        </FormItem>
      )}
    />
  );
}