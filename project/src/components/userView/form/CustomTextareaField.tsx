// components/forms/CustomTextareaField.tsx
import { useFormContext } from "react-hook-form";
import { MessageSquareText } from "lucide-react"; // Default icon
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

interface CustomTextareaFieldProps {
  name: string;
  label: string;
  placeholder: string;
  icon?: React.ElementType;
  rows?: number;
}

export function CustomTextareaField({ name, label, placeholder, icon: Icon = MessageSquareText, rows = 4 }: CustomTextareaFieldProps) {
  const { control } = useFormContext();

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
            <Textarea
              placeholder={placeholder}
              rows={rows}
              {...field}
              className={`text-[#212121] rounded-lg p-3 w-full transition-all duration-200 ${colors.inputBgBorderFocus}`}
            />
          </FormControl>
          <FormMessage className="text-red-600 text-sm mt-2" />
        </FormItem>
      )}
    />
  );
}