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
        <Star className="mr-3 h-5 w-5 text-[#4CAF50]" /> Rate Plans
      </FormLabel>
      <div className="space-y-4 rounded-lg border border-[#1B5E20] p-4 bg-[#A5D6A7]/10">
        <Select
          onValueChange={(value: "Basic" | "Standard" | "Premium") =>
            setNewRatePlan({ ...newRatePlan, type: value })
          }
          defaultValue={newRatePlan.type}
        >
          <SelectTrigger className="bg-white border-[#1B5E20]/50 text-[#212121] rounded-lg p-2.5 w-full focus:ring-[#4CAF50] focus:border-[#4CAF50]">
            <SelectValue placeholder="Select plan type" />
          </SelectTrigger>
          <SelectContent className="bg-white border-[#1B5E20] text-[#212121] rounded-lg shadow-lg">
            <SelectItem value="Basic" className="hover:bg-[#A5D6A7]/30 cursor-pointer">
              Basic
            </SelectItem>
            <SelectItem value="Standard" className="hover:bg-[#A5D6A7]/30 cursor-pointer">
              Standard
            </SelectItem>
            <SelectItem value="Premium" className="hover:bg-[#A5D6A7]/30 cursor-pointer">
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
          className="bg-white border-[#1B5E20]/50 text-[#212121] placeholder-[#757575] focus:ring-[#4CAF50] focus:border-[#4CAF50] rounded-lg p-2.5 w-full"
        />
        <Textarea
          placeholder="Plan Description"
          value={newRatePlan.description}
          onChange={(e) =>
            setNewRatePlan({ ...newRatePlan, description: e.target.value })
          }
          className="bg-white border-[#1B5E20]/50 text-[#212121] placeholder-[#757575] focus:ring-[#4CAF50] focus:border-[#4CAF50] rounded-lg p-2.5 w-full min-h-[80px]"
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
          className="bg-white border-[#1B5E20]/50 text-[#212121] placeholder-[#757575] focus:ring-[#4CAF50] focus:border-[#4CAF50] rounded-lg p-2.5 w-full"
        />
        <Input
          type="number"
          placeholder="Delivery Days (e.g., 3)"
          value={newRatePlan.deliveryDays || ""}
          onChange={(e) =>
            setNewRatePlan({ ...newRatePlan, deliveryDays: parseInt(e.target.value) || 1 })
          }
          className="bg-white border-[#1B5E20]/50 text-[#212121] placeholder-[#757575] focus:ring-[#4CAF50] focus:border-[#4CAF50] rounded-lg p-2.5 w-full"
        />
        <Button
          type="button"
          onClick={addRatePlan}
          className="w-full bg-[#2E7D32] hover:bg-[#4CAF50] text-white font-medium py-2.5 rounded-lg transition-all duration-300"
        >
          Add Rate Plan
        </Button>
      </div>
      {ratePlans.length > 0 && (
        <div className="mt-4 space-y-2">
          {ratePlans.map((plan, index) => (
            <Badge
              key={index}
              className="bg-[#2E7D32] hover:bg-[#4CAF50] text-white px-3 py-1 rounded-full text-sm flex items-center justify-between w-full"
            >
              <span>
                {plan.type}: ${plan.price} ({plan.deliveryDays} Days)
              </span>
              <button
                type="button"
                onClick={() => removeRatePlan(index)}
                className="ml-2 rounded-full hover:bg-[#1B5E20] p-0.5"
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