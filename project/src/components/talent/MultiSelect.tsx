"use client";

import { useState } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface MultiSelectProps<T extends FieldValues> {
  control: Control<T>;
  // 2. Use Path<T> for the name prop
  name: Path<T>;
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  Icon?: React.ElementType;
}

export function MultiSelect<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  options,
  Icon,
}: MultiSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
      <Controller
      control={control}
      name={name} 
      render={({ field, fieldState: { error } }) => (
        <div className="space-y-2">
          <label className="text-[#212121] font-semibold flex items-center">
            {Icon && <Icon className="h-5 w-5 text-[#8DBCC7] mr-2" />}
            {label}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full p-3 bg-white border border-[#90D1CA] rounded-lg text-left text-[#212121] focus:outline-none focus:ring-2 focus:ring-[#8DBCC7]"
            >
              {field.value && Array.isArray(field.value) && field.value.length > 0
                ? field.value.join(", ")
                : placeholder}
            </button>
            {isOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-[#90D1CA] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center p-2 hover:bg-[#F5F6F5] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={field.value?.includes(option.value)}
                      onChange={(e) => {
                        const newValue = Array.isArray(field.value) ? [...field.value] : [];
                        if (e.target.checked) {
                          newValue.push(option.value);
                        } else {
                          const index = newValue.indexOf(option.value);
                          if (index > -1) newValue.splice(index, 1);
                        }
                        field.onChange(newValue);
                      }}
                      className="mr-2"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          {error && <p className="text-red-600 text-sm">{error.message}</p>}
        </div>
      )}
    />
  );
}