import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SearchFilters } from "../types";
import { FIELD_LABELS, FILTER_LABELS } from "../constants";

interface FilterChipsProps {
  filters: Partial<SearchFilters>;
  onRemove: (key: keyof SearchFilters, value?: string) => void;
  onReset: () => void;
  sportNames: Record<string, string>;
}

// Check if field should be ignored in filter chips
const shouldIgnoreField = (key: keyof SearchFilters): boolean => {
  // 宽松比较，避免 keyof 与字符串数组的类型不匹配
  return (["limit", "offset"] as readonly string[]).includes(key as string);
};

// Check if field is multi-value
const isMultiValueField = (key: keyof SearchFilters): boolean => {
  return (
    [
      "cert_type",
      "lessons",
      "duration",
      "styles",
      "comm_styles",
      "pace_intensities",
      "prefer_students",
      "training_modes",
      "available_time_slots",
      "goals",
      "skill_levels",
      "age_groups",
    ] as readonly string[]
  ).includes(key as string);
};

// Get field display label
const getFieldLabel = (key: keyof SearchFilters): string => {
  // 放宽常量字典的类型，避免“Element implicitly has an 'any' type ...”报错
  const map = FIELD_LABELS as unknown as Record<string, string>;
  return map[key as string] ?? (key as string);
};

// Get value display label
const getValueLabel = (
  key: keyof SearchFilters,
  value: string | number | boolean,
  sportNames: Record<string, string>
): string => {
  // 统一把 value 转成字符串作为兜底
  const vStr = String(value);

  if (key === "sport") {
    return sportNames[vStr] ?? vStr;
  }
  if (key === "has_certificate") {
    // FILTER_LABELS 的精确类型未知，这里放宽读取
    return (FILTER_LABELS as any).has_certificate ?? "Certification";
  }
  if (key === "preferred_frequency") {
    const dict = (FILTER_LABELS as any).preferred_frequency as
      | Record<string, string>
      | undefined;
    return dict?.[vStr] ?? vStr;
  }
  if (key === "skill_level") {
    const dict = (FILTER_LABELS as any).skill_level as
      | Record<string, string>
      | undefined;
    return dict?.[vStr] ?? vStr;
  }
  if (key === "min_exp") {
    return `≥${vStr}y`;
  }
  return vStr;
};

export function FilterChips({
  filters,
  onRemove,
  onReset,
  sportNames,
}: FilterChipsProps) {
  // Don't render if no filters
  if (Object.keys(filters).length === 0) {
    return null;
  }

  // Render single value chip
  const renderSingleValueChip = (key: keyof SearchFilters, value: any) => {
    const label = getValueLabel(key, value as string | number | boolean, sportNames);
    return (
      <Badge
        key={`${String(key)}-${String(value)}`}
        variant="secondary"
        className="h-7 px-2 cursor-pointer hover:bg-gray-200"
        onClick={() => onRemove(key)}
        role="button"
        aria-label={`Remove filter: ${getFieldLabel(key)}=${label}`}
      >
        {`${getFieldLabel(key)}: ${label}`}
        <X className="ml-1 h-3 w-3" />
      </Badge>
    );
  };

  // Render multi-value chips
  const renderMultiValueChips = (key: keyof SearchFilters, values: string[]) => {
    const displayValues = values.slice(0, 4);
    const remainingCount = values.length - 4;

    return (
      <div key={String(key)} className="flex flex-wrap gap-2">
        {displayValues.map((value) => (
          <Badge
            key={`${String(key)}-${value}`}
            variant="secondary"
            className="h-7 px-2 cursor-pointer hover:bg-gray-200"
            onClick={() => onRemove(key, value)}
            role="button"
            aria-label={`Remove filter: ${getFieldLabel(key)}=${value}`}
          >
            {`${getFieldLabel(key)}: ${value}`}
            <X className="ml-1 h-3 w-3" />
          </Badge>
        ))}
        {remainingCount > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Badge
                variant="secondary"
                className="h-7 px-2 cursor-pointer hover:bg-gray-200"
                role="button"
                aria-label={`Show more ${getFieldLabel(key)} options`}
              >
                +{remainingCount}
              </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <ScrollArea className="h-[200px]">
                <div className="space-y-2 p-2">
                  {values.slice(4).map((value) => (
                    <div key={value} className="flex items-center justify-between">
                      <span className="text-sm">{value}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(key, value)}
                        aria-label={`Remove filter: ${getFieldLabel(key)}=${value}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {Object.entries(filters).map(([key, value]) => {
        // Skip empty values and ignored fields
        if (
          value == null ||
          (Array.isArray(value) && value.length === 0) ||
          shouldIgnoreField(key as keyof SearchFilters)
        ) {
          return null;
        }

        // Handle multi-value fields
        if (isMultiValueField(key as keyof SearchFilters) && Array.isArray(value)) {
          return renderMultiValueChips(key as keyof SearchFilters, value as string[]);
        }

        // Handle single value fields
        return renderSingleValueChip(key as keyof SearchFilters, value);
      })}

      {/* Reset All button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="text-gray-500 hover:text-gray-900"
        aria-label="Clear all filters"
      >
        Reset All
      </Button>
    </div>
  );
}
