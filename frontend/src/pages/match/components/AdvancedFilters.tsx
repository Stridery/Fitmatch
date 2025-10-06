import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MOCK_OPTIONS } from "../types";
import type { SearchFilters } from "../types";

interface AdvancedFiltersProps {
  draft: Partial<SearchFilters>;
  onDraftChange: (draft: Partial<SearchFilters>) => void;
  onSubmit: () => void;
  onReset: () => void;
}

export function AdvancedFilters({
  draft,
  onDraftChange,
  onSubmit,
  onReset,
}: AdvancedFiltersProps) {
  // Helper function to update draft
  const updateDraft = (updates: Partial<SearchFilters>) => {
    onDraftChange({ ...draft, ...updates });
  };

  // Helper function to handle multi-select
  const handleMultiSelect = (field: keyof SearchFilters, value: string) => {
    const currentValues = (draft[field] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    updateDraft({ [field]: newValues });
  };

  // Handle submit and close
  const handleSubmit = () => {
    onSubmit();
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="text-gray-900 bg-white hover:bg-gray-100">
          More Filters
          {Object.keys(draft).length > 4 && (
            <Badge variant="secondary" className="ml-2">
              {Object.keys(draft).length - 4}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Advanced Filters</SheetTitle>
          <SheetDescription>
            Refine your search with additional filters. Changes will be applied when you click Apply Filters.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] pr-4">
          <div className="space-y-6 py-6">
            {/* Certification */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_certificate"
                  checked={draft.has_certificate}
                  onCheckedChange={(checked) =>
                    updateDraft({ has_certificate: checked as boolean })
                  }
                />
                <Label htmlFor="has_certificate">Has Certification</Label>
              </div>

              {draft.has_certificate && (
                <div className="space-y-2 pl-6">
                  <Label>Certificate Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {MOCK_OPTIONS.cert_type.map((cert) => (
                      <Badge
                        key={cert}
                        variant={draft.cert_type?.includes(cert) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleMultiSelect("cert_type", cert)}
                      >
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Types */}
            <div className="space-y-2">
              <Label>Lesson Types</Label>
              <div className="flex flex-wrap gap-2">
                {MOCK_OPTIONS.lessons.map((lesson) => (
                  <Badge
                    key={lesson}
                    variant={draft.lessons?.includes(lesson) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleMultiSelect("lessons", lesson)}
                  >
                    {lesson}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="flex flex-wrap gap-2">
                {MOCK_OPTIONS.duration.map((duration) => (
                  <Badge
                    key={duration}
                    variant={draft.duration?.includes(duration) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleMultiSelect("duration", duration)}
                  >
                    {duration}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Styles */}
            <div className="space-y-2">
              <Label>Teaching Styles</Label>
              <div className="flex flex-wrap gap-2">
                {MOCK_OPTIONS.styles.map((style) => (
                  <Badge
                    key={style}
                    variant={draft.styles?.includes(style) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleMultiSelect("styles", style)}
                  >
                    {style}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Communication Styles */}
            <div className="space-y-2">
              <Label>Communication Styles</Label>
              <div className="flex flex-wrap gap-2">
                {MOCK_OPTIONS.comm_styles.map((style) => (
                  <Badge
                    key={style}
                    variant={draft.comm_styles?.includes(style) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleMultiSelect("comm_styles", style)}
                  >
                    {style}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Pace Intensities */}
            <div className="space-y-2">
              <Label>Pace & Intensity</Label>
              <div className="flex flex-wrap gap-2">
                {MOCK_OPTIONS.pace_intensities.map((pace) => (
                  <Badge
                    key={pace}
                    variant={draft.pace_intensities?.includes(pace) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleMultiSelect("pace_intensities", pace)}
                  >
                    {pace}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Preferred Students */}
            <div className="space-y-2">
              <Label>Preferred Students</Label>
              <div className="flex flex-wrap gap-2">
                {MOCK_OPTIONS.prefer_students.map((type) => (
                  <Badge
                    key={type}
                    variant={draft.prefer_students?.includes(type) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleMultiSelect("prefer_students", type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Training Modes */}
            <div className="space-y-2">
              <Label>Training Modes</Label>
              <div className="flex flex-wrap gap-2">
                {MOCK_OPTIONS.training_modes.map((mode) => (
                  <Badge
                    key={mode}
                    variant={draft.training_modes?.includes(mode) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleMultiSelect("training_modes", mode)}
                  >
                    {mode}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Available Time Slots */}
            <div className="space-y-2">
              <Label>Available Time Slots</Label>
              <div className="flex flex-wrap gap-2">
                {MOCK_OPTIONS.available_time_slots.map((slot) => (
                  <Badge
                    key={slot}
                    variant={draft.available_time_slots?.includes(slot) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleMultiSelect("available_time_slots", slot)}
                  >
                    {slot}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div className="space-y-2">
              <Label>Goals</Label>
              <div className="flex flex-wrap gap-2">
                {MOCK_OPTIONS.goals.map((goal) => (
                  <Badge
                    key={goal}
                    variant={draft.goals?.includes(goal) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleMultiSelect("goals", goal)}
                  >
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Age Groups */}
            <div className="space-y-2">
              <Label>Age Groups</Label>
              <div className="flex flex-wrap gap-2">
                {MOCK_OPTIONS.age_groups.map((age) => (
                  <Badge
                    key={age}
                    variant={draft.age_groups?.includes(age) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleMultiSelect("age_groups", age)}
                  >
                    {age}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Numeric Input */}
            <div>
              <div className="space-y-2">
                <Label>Min. Experience (Years)</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.min_exp || ""}
                  onChange={(e) =>
                    updateDraft({ min_exp: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="pt-4">
          <div className="flex justify-between w-full gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onReset}
            >
              Reset All
            </Button>
            <SheetClose asChild>
              <Button
                className="flex-1"
                onClick={handleSubmit}
              >
                Apply Filters
              </Button>
            </SheetClose>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}