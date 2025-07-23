
"use client";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Control, FieldValues, Path } from "react-hook-form";
import { LucideIcon } from "lucide-react";

interface TextareaFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder: string;
  Icon: LucideIcon;
}

export function TextareaField<T extends FieldValues>({ control, name, label, placeholder, Icon }: TextareaFieldProps<T>) {
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
            <Textarea
              placeholder={placeholder}
              {...field}
              value={field.value || ""}
              className="bg-[#A5D6A7]/20 border-[#1B5E20] text-[#212121] placeholder-[#757575] focus:ring-[#4CAF50] focus:border-[#4CAF50] rounded-lg p-3 w-full min-h-[100px] transition-all duration-200"
            />
          </FormControl>
          <FormMessage className="text-red-600 text-sm mt-2" />
        </FormItem>
      )}
    />
  );
}