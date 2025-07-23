"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control, FieldValues, Path } from "react-hook-form";
import { LucideIcon } from "lucide-react";

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
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[#212121] font-semibold text-base flex items-center">
            <Icon className="mr-3 h-5 w-5 text-[#4CAF50]" /> {label}
          </FormLabel>
          <FormControl>
            <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
              <SelectTrigger className="bg-[#A5D6A7]/20 border-[#1B5E20] text-[#212121] rounded-lg p-3 w-full focus:ring-[#4CAF50] focus:border-[#4CAF50] transition-all duration-200">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#1B5E20] text-[#212121] rounded-lg shadow-lg">
                {options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="hover:bg-[#A5D6A7]/30 cursor-pointer"
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