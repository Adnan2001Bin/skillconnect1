"use client";

import { LucideIcon, XCircle } from "lucide-react";
import { Control, FieldValues, Path } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

interface ArrayFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder: string;
  Icon: LucideIcon;
}

export function ArrayField<T extends FieldValues>({ control, name, label, placeholder, Icon }: ArrayFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const currentValue = (field.value || []) as string[];
        return (
          <FormItem>
            <FormLabel className="text-[#212121] font-semibold text-base flex items-center">
              <Icon className="mr-3 h-5 w-5 text-[#4CAF50]" /> {label}
            </FormLabel>
            <FormControl>
              <div>
                <Input
                  placeholder={placeholder}
                  onKeyDown={(e) => {
                    if (["Enter", ","].includes(e.key)) {
                      e.preventDefault();
                      const input = e.currentTarget as HTMLInputElement;
                      const value = input.value.trim();
                      if (value) {
                        field.onChange([...currentValue, value]);
                        input.value = "";
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value.trim();
                    if (value) {
                      field.onChange([...currentValue, value]);
                      e.target.value = "";
                    }
                  }}
                  className="bg-[#A5D6A7]/20 border-[#1B5E20] text-[#212121] placeholder-[#757575] focus:ring-[#4CAF50] focus:border-[#4CAF50] rounded-lg p-3 w-full transition-all duration-200"
                />
                {currentValue.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {currentValue.map((item, index) => (
                      <Badge
                        key={index}
                        className="bg-[#2E7D32] hover:bg-[#4CAF50] text-white px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange(currentValue.filter((_, i) => i !== index));
                          }}
                          className="ml-2 rounded-full hover:bg-[#1B5E20] p-0.5"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </FormControl>
            <p className="text-[#757575] text-xs mt-1">
              Press comma or enter to add each {label.toLowerCase()}.
            </p>
            <FormMessage className="text-red-600 text-sm mt-2" />
          </FormItem>
        );
      }}
    />
  );
}