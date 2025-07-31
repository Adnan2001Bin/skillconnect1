// components/forms/BudgetField.tsx
import { useFormContext } from "react-hook-form";
import { DollarSign } from "lucide-react"; // Or the icon you prefer for budget
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface BudgetFieldProps {
  name: string;
  label: string;
  placeholder: string;
  icon?: React.ElementType; // Allow custom icon, defaults to DollarSign
}

export function BudgetField({ name, label, placeholder, icon: Icon = DollarSign }: BudgetFieldProps) {
  const { control } = useFormContext(); // Use useFormContext to access form methods

  // Define colors consistent with your theme
  const colors = {
    labelIconColor: "text-[#4CAF50]",
    inputBgBorderFocus: "bg-[#A5D6A7]/20 border-[#1B5E20] focus:ring-[#4CAF50] focus:border-[#4CAF50]",
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[#212121] font-semibold text-base flex items-center">
            {Icon && <Icon className={`mr-3 h-5 w-5 ${colors.labelIconColor}`} />}
            {label}
          </FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder={placeholder}
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className={`text-[#212121] rounded-lg p-3 w-full transition-all duration-200 ${colors.inputBgBorderFocus}`}
            />
          </FormControl>
          <FormMessage className="text-red-600 text-sm mt-2" />
        </FormItem>
      )}
    />
  );
}