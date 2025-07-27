"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

interface MultiSelectProps {
  name: string;
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  Icon?: React.ElementType;
  onChange?: (value: string[]) => void;
  defaultValue?: string[];
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Define color scheme consistent with UserTalentView
  const accentColor = "#15B392";
  const primary = "#16423C";
  const activeTextColor = "#16423C"; // Used for the label
  const white = "#FFFFFF"; // For the dropdown background and text


  useEffect(() => {
    setSelectedValues(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    onChange?.(newValue);
  };

  const getDisplayValue = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    const selectedLabels = selectedValues
      .map((value) => options.find((opt) => opt.value === value)?.label || value);
    return selectedLabels.join(", ");
  };

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <label
        className="text-sm font-semibold flex items-center"
        style={{ color: activeTextColor }}
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
          className="w-full p-3 border-2 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 flex justify-between items-center text-ellipsis overflow-hidden whitespace-nowrap"
          style={{
            borderColor: accentColor,
            color: primary,
            backgroundColor: white,
            boxShadow: `0 0 0 2px ${isOpen ? accentColor : 'transparent'}`,
          }}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="flex-grow min-w-0">{getDisplayValue()}</span>
          <ChevronDown
            className={`flex-shrink-0 h-4 w-4 transform transition-transform duration-200 ml-2 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
            style={{ color: primary }}
          />
        </button>
        {isOpen && (
          <div
            className="absolute z-20 w-full mt-1 border-2 rounded-lg shadow-xl max-h-60 overflow-y-auto transform-gpu animate-fade-in-down"
            style={{
              borderColor: accentColor,
              backgroundColor: white,
            }}
            role="listbox"
          >
            {options.length === 0 ? (
              <div className="p-3 text-sm text-center" style={{ color: primary }}>No services available for this category.</div>
            ) : (
              options.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center p-3 cursor-pointer transition-colors duration-200 hover:bg-gray-100"
                  style={{ color: primary }}
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={(e) => handleChange(option.value, e.target.checked)}
                    className="mr-3 h-5 w-5 border-gray-300 rounded focus:ring-2"
                    style={{
                      accentColor: accentColor,
                    }}
                  />
                  <span className="flex-grow text-base">{option.label}</span>
                  {selectedValues.includes(option.value) && (
                    <Check className="ml-auto h-5 w-5" style={{ color: accentColor }} />
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