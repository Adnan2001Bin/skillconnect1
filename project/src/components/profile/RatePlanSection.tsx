"use client";

import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface RatePlan {
  type: "Basic" | "Standard" | "Premium";
  price: number;
  description: string;
  whatsIncluded: string[];
  deliveryDays: number;
}

interface RatePlanSectionProps {
  ratePlans: RatePlan[];
  setRatePlans: (plans: RatePlan[]) => void;
  form: any; // Replace with proper form type if possible
}

export function RatePlanSection({ ratePlans, setRatePlans, form }: RatePlanSectionProps) {
  const [newRatePlan, setNewRatePlan] = useState<RatePlan>({
    type: "Basic",
    price: 0,
    description: "",
    whatsIncluded: [""],
    deliveryDays: 1,
  });

  // Define the new color themes directly
  const labelIconColor = "text-[#8DBCC7]";
  const sectionBgBorder = "space-y-4 rounded-lg border border-[#90D1CA] p-4 bg-[#A4CCD9]/10";
  const inputSelectBgBorderFocus = "bg-white border-[#90D1CA]/50 text-[#212121] placeholder-[#757575] focus:ring-[#8DBCC7] focus:border-[#8DBCC7]";
  const selectContentBorder = "border-[#90D1CA]";
  const selectItemHover = "hover:bg-[#A4CCD9]/30";
  const addButtonBgHover = "bg-[#90D1CA] hover:bg-[#8DBCC7] text-white";
  const badgeBgHover = "bg-[#90D1CA] hover:bg-[#8DBCC7]";
  const removeButtonHover = "hover:bg-[#C4E1E6]";

  const addRatePlan = () => {
    if (newRatePlan.description && newRatePlan.whatsIncluded[0]) {
      setRatePlans([...ratePlans, { ...newRatePlan }]);
      form.setValue("ratePlans", [...ratePlans, { ...newRatePlan }]);
      setNewRatePlan({
        type: "Basic",
        price: 0,
        description: "",
        whatsIncluded: [""],
        deliveryDays: 1,
      });
    } else {
      toast.error("Error", {
        description: "Rate plan description and at least one included item are required.",
        className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    }
  };

  const removeRatePlan = (indexToRemove: number) => {
    setRatePlans(ratePlans.filter((_, index) => index !== indexToRemove));
    form.setValue("ratePlans", ratePlans.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div>
      <FormLabel className="text-[#212121] font-semibold text-base flex items-center mb-2">
        <Star className={`mr-3 h-5 w-5 ${labelIconColor}`} /> Rate Plans
      </FormLabel>
      <div className={sectionBgBorder}>
        <Select
          onValueChange={(value: "Basic" | "Standard" | "Premium") =>
            setNewRatePlan({ ...newRatePlan, type: value })
          }
          defaultValue={newRatePlan.type}
        >
          <SelectTrigger className={`${inputSelectBgBorderFocus} rounded-lg p-2.5 w-full`}>
            <SelectValue placeholder="Select plan type" />
          </SelectTrigger>
          <SelectContent className={`bg-white text-[#212121] rounded-lg shadow-lg ${selectContentBorder}`}>
            <SelectItem value="Basic" className={`${selectItemHover} cursor-pointer`}>
              Basic
            </SelectItem>
            <SelectItem value="Standard" className={`${selectItemHover} cursor-pointer`}>
              Standard
            </SelectItem>
            <SelectItem value="Premium" className={`${selectItemHover} cursor-pointer`}>
              Premium
            </SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="number"
          placeholder="Price (e.g., 50)"
          value={newRatePlan.price || ""}
          onChange={(e) =>
            setNewRatePlan({ ...newRatePlan, price: parseFloat(e.target.value) || 0 })
          }
          className={`${inputSelectBgBorderFocus} rounded-lg p-2.5 w-full`}
        />
        <Textarea
          placeholder="Plan Description"
          value={newRatePlan.description}
          onChange={(e) =>
            setNewRatePlan({ ...newRatePlan, description: e.target.value })
          }
          className={`${inputSelectBgBorderFocus} rounded-lg p-2.5 w-full min-h-[80px]`}
        />
        <Input
          placeholder="What's Included (comma-separated)"
          value={newRatePlan.whatsIncluded.join(", ")}
          onChange={(e) =>
            setNewRatePlan({
              ...newRatePlan,
              whatsIncluded: e.target.value.split(",").map((item) => item.trim()),
            })
          }
          className={`${inputSelectBgBorderFocus} rounded-lg p-2.5 w-full`}
        />
        <Input
          type="number"
          placeholder="Delivery Days (e.g., 3)"
          value={newRatePlan.deliveryDays || ""}
          onChange={(e) =>
            setNewRatePlan({ ...newRatePlan, deliveryDays: parseInt(e.target.value) || 1 })
          }
          className={`${inputSelectBgBorderFocus} rounded-lg p-2.5 w-full`}
        />
        <Button
          type="button"
          onClick={addRatePlan}
          className={`w-full font-medium py-2.5 rounded-lg transition-all duration-300 ${addButtonBgHover}`}
        >
          Add Rate Plan
        </Button>
      </div>
      {ratePlans.length > 0 && (
        <div className="mt-4 space-y-2">
          {ratePlans.map((plan, index) => (
            <Badge
              key={index}
              className={`text-white px-3 py-1 rounded-full text-sm flex items-center justify-between w-full ${badgeBgHover}`}
            >
              <span>
                {plan.type}: ${plan.price} ({plan.deliveryDays} Days)
              </span>
              <button
                type="button"
                onClick={() => removeRatePlan(index)}
                className={`ml-2 rounded-full p-0.5 ${removeButtonHover}`}
              >
                <XCircle className="h-4 w-4" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {form.formState.errors.ratePlans && (
        <p className="text-red-600 text-sm mt-2">
          {form.formState.errors.ratePlans.message}
        </p>
      )}
    </div>
  );
}