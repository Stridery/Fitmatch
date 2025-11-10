import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface EventAdvancedFiltersProps {
  // Three enum fields - adjust field names and values based on your actual schema
  field1?: string | null;
  field2?: string | null;
  field3?: string | null;
  onField1Change: (value: string | null) => void;
  onField2Change: (value: string | null) => void;
  onField3Change: (value: string | null) => void;
  onSubmit: () => void;
  onReset: () => void;
  // Field configurations - update these based on your actual enum values
  field1Config?: { label: string; options: string[] };
  field2Config?: { label: string; options: string[] };
  field3Config?: { label: string; options: string[] };
}

export function EventAdvancedFilters({
  field1,
  field2,
  field3,
  onField1Change,
  onField2Change,
  onField3Change,
  onSubmit,
  onReset,
  field1Config,
  field2Config,
  field3Config,
}: EventAdvancedFiltersProps) {
  const hasActiveFilters = field1 || field2 || field3;

  const handleSubmit = () => {
    onSubmit();
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="text-white bg-gray-700 border-gray-600 hover:bg-gray-600"
        >
          Advanced Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2 bg-blue-600 text-white">
              {[field1, field2, field3].filter(Boolean).length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl bg-gray-800 border-gray-700">
        <SheetHeader>
          <SheetTitle className="text-white">Advanced Filters</SheetTitle>
          <SheetDescription className="text-gray-400">
            Refine your search with additional filters. Changes will be applied when you click Apply Filters.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] pr-4">
          <div className="space-y-6 py-6">
            {/* Field 1 */}
            {field1Config && (
              <div className="space-y-2">
                <Label className="text-gray-300">{field1Config.label}</Label>
                <ToggleGroup
                  type="single"
                  value={field1 || undefined}
                  onValueChange={(value) => onField1Change(value || null)}
                  className="justify-start gap-2 flex-wrap"
                >
                  <ToggleGroupItem
                    value=""
                    aria-label="All"
                    variant="outline"
                    className={`${
                      !field1
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white'
                    }`}
                  >
                    All
                  </ToggleGroupItem>
                  {field1Config.options.map((option) => (
                    <ToggleGroupItem
                      key={option}
                      value={option}
                      aria-label={option}
                      variant="outline"
                      className={`${
                        field1 === option
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white'
                      }`}
                    >
                      {option}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            )}

            {/* Field 2 */}
            {field2Config && (
              <div className="space-y-2">
                <Label className="text-gray-300">{field2Config.label}</Label>
                <ToggleGroup
                  type="single"
                  value={field2 || undefined}
                  onValueChange={(value) => onField2Change(value || null)}
                  className="justify-start gap-2 flex-wrap"
                >
                  <ToggleGroupItem
                    value=""
                    aria-label="All"
                    variant="outline"
                    className={`${
                      !field2
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white'
                    }`}
                  >
                    All
                  </ToggleGroupItem>
                  {field2Config.options.map((option) => (
                    <ToggleGroupItem
                      key={option}
                      value={option}
                      aria-label={option}
                      variant="outline"
                      className={`${
                        field2 === option
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white'
                      }`}
                    >
                      {option}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            )}

            {/* Field 3 */}
            {field3Config && (
              <div className="space-y-2">
                <Label className="text-gray-300">{field3Config.label}</Label>
                <ToggleGroup
                  type="single"
                  value={field3 || undefined}
                  onValueChange={(value) => onField3Change(value || null)}
                  className="justify-start gap-2 flex-wrap"
                >
                  <ToggleGroupItem
                    value=""
                    aria-label="All"
                    variant="outline"
                    className={`${
                      !field3
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white'
                    }`}
                  >
                    All
                  </ToggleGroupItem>
                  {field3Config.options.map((option) => (
                    <ToggleGroupItem
                      key={option}
                      value={option}
                      aria-label={option}
                      variant="outline"
                      className={`${
                        field3 === option
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white'
                      }`}
                    >
                      {option}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="pt-4">
          <div className="flex justify-between w-full gap-4">
            <Button
              variant="outline"
              className="flex-1 bg-gray-600 text-white hover:bg-gray-500 border-gray-500"
              onClick={onReset}
            >
              Reset All
            </Button>
            <SheetClose asChild>
              <Button
                className="flex-1 bg-white hover:bg-gray-100 text-black"
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

