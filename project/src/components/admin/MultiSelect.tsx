"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

interface MultiSelectProps {
  name: string;
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  Icon?: React.ElementType;
  onChange?: (value: string[]) => void;
  defaultValue?: string[]; // Added to support initial values
}

export function MultiSelect({
  name,
  label,
  placeholder,
  options,
  Icon,
  onChange,
  defaultValue = [],
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>(defaultValue);

  // Define color scheme consistent with AdminTalentView
  const accentColor = "#A5BFCC";
  const primaryDarkGray = "#2D3748";
  const activeTextColor = "#FFFFFF"; // Used for the label
  const white = "#FFFFFF"; // For the dropdown background and text
  const hoverColor = "#A4CCD9"; // A slightly darker shade of accent for hover states

  const handleChange = (value: string, checked: boolean) => {
    const newValue = [...selectedValues];
    if (checked) {
      if (!newValue.includes(value)) {
        newValue.push(value);
      }
    } else {
      const index = newValue.indexOf(value);
      if (index > -1) {
        newValue.splice(index, 1);
      }
    }
    setSelectedValues(newValue);
    onChange?.(newValue); // Call custom onChange
  };

  return (
    <div className="space-y-2">
      <label
        className="text-sm font-semibold flex items-center"
        style={{ color: activeTextColor }} // Label text color
      >
        {Icon && (
          <Icon
            className="h-5 w-5 mr-2"
            style={{ color: accentColor }}
            aria-hidden="true"
          />
        )}
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 border rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 flex justify-between items-center"
          style={{
            borderColor: accentColor,
            color: primaryDarkGray, // Button text color (selected values)
            backgroundColor: white, // Button background
            boxShadow: `0 0 0 2px ${isOpen ? accentColor : 'transparent'}`, // Focus ring
          }}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="truncate">
            {selectedValues.length > 0 ? selectedValues.join(", ") : placeholder}
          </span>
          <ChevronDown
            className={`h-4 w-4 transform transition-transform duration-200 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
            style={{ color: primaryDarkGray }}
          />
        </button>
        {isOpen && (
          <div
            className="absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto"
            style={{
              borderColor: accentColor,
              backgroundColor: white, // Dropdown background
            }}
            role="listbox"
          >
            {options.length === 0 ? (
              <div className="p-2 text-sm" style={{ color: primaryDarkGray }}>No services available for this category.</div>
            ) : (
              options.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center p-2 cursor-pointer transition-colors duration-200"
                  style={{ color: primaryDarkGray, backgroundColor: white }}
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={(e) => handleChange(option.value, e.target.checked)}
                    className="mr-2 h-4 w-4 border-gray-300 rounded"
                    style={{
                      accentColor: accentColor, // Checkbox color
                    }}
                  />
                  <span>{option.label}</span>
                  {selectedValues.includes(option.value) && (
                    <Check className="ml-auto h-4 w-4" style={{ color: accentColor }} />
                  )}
                </label>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}