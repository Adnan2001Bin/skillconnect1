"use client";

import { LucideIcon, XCircle } from "lucide-react";
import { Control, FieldValues, Path } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useSession } from "next-auth/react";

interface ArrayFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder: string;
  Icon: LucideIcon;
}

export function ArrayField<T extends FieldValues>({ control, name, label, placeholder, Icon }: ArrayFieldProps<T>) {
  const { data: session } = useSession();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const currentValue = (field.value || []) as string[];

        // Define color themes based on role
        const isTalent = session?.user?.role === "talent";

        const labelIconColor = isTalent ? "text-[#8DBCC7]" : "text-[#4CAF50]";
        const inputBgBorderFocus = isTalent
          ? "bg-[#A4CCD9]/20 border-[#90D1CA] focus:ring-[#8DBCC7] focus:border-[#8DBCC7]"
          : "bg-[#A5D6A7]/20 border-[#1B5E20] focus:ring-[#4CAF50] focus:border-[#4CAF50]";
        const badgeColors = isTalent
          ? "bg-[#90D1CA] hover:bg-[#8DBCC7]"
          : "bg-[#2E7D32] hover:bg-[#4CAF50]";
        const removeButtonHover = isTalent ? "hover:bg-[#C4E1E6]" : "hover:bg-[#1B5E20]";

        return (
          <FormItem>
            <FormLabel className="text-[#212121] font-semibold text-base flex items-center">
              <Icon className={`mr-3 h-5 w-5 ${labelIconColor}`} /> {label}
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
                  className={`text-[#212121] placeholder-[#757575] rounded-lg p-3 w-full transition-all duration-200 ${inputBgBorderFocus}`}
                />
                {currentValue.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {currentValue.map((item, index) => (
                      <Badge
                        key={index}
                        className={`text-white px-3 py-1 rounded-full text-sm flex items-center ${badgeColors}`}
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange(currentValue.filter((_, i) => i !== index));
                          }}
                          className={`ml-2 rounded-full p-0.5 ${removeButtonHover}`}
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