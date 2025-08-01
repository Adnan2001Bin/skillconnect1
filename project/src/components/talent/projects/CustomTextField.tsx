import { useFormContext } from "react-hook-form";
import { Briefcase } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface CustomTextFieldProps {
  name: string;
  label: string;
  placeholder: string;
  icon?: React.ElementType;
  type?: string;
}

export function CustomTextField({ name, label, placeholder, icon: Icon = Briefcase, type = "text" }: CustomTextFieldProps) {
  const { control } = useFormContext();

  const colors = {
    labelIconColor: "text-[#8DBCC7]",
    inputBgBorderFocus: "bg-[#90D1CA]/20 border-[#212121] focus:ring-[#8DBCC7] focus:border-[#8DBCC7]",
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
              type={type}
              placeholder={placeholder}
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