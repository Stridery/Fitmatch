import { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { SearchFilters, Sport, City } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdvancedFilters } from "./AdvancedFilters";

interface FiltersProps {
  initial: Partial<SearchFilters>;
  sports: Sport[];
  cities: City[];
  onSubmit: (filters: Partial<SearchFilters>) => void;
  onReset: () => void;
}

export function Filters({ initial, sports, cities, onSubmit, onReset }: FiltersProps) {
  // Local draft state
  const [draft, setDraft] = useState<Partial<SearchFilters>>(initial);

  // Update draft when initial changes (URL sync)
  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  // Get selected sport name
  const selectedSport = sports.find(sport => sport.name.toLowerCase() === draft.sport);

  // Local handlers
  const handleSubmit = () => {
    onSubmit(draft);
  };

  const handleReset = () => {
    setDraft({});
    onReset();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Sport Select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="justify-between text-gray-900 bg-white hover:bg-gray-100"
            >
              {selectedSport ? selectedSport.name : "Select sport"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search sports..." />
              <CommandEmpty>No sport found.</CommandEmpty>
              <CommandGroup>
                {sports.map((sport) => (
                  <CommandItem
                    key={sport.id}
                    value={sport.name}
                    onSelect={() => {
                      setDraft(prev => ({ ...prev, sport: sport.name.toLowerCase() }));
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        draft.sport === sport.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {sport.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {/* City Select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="justify-between text-gray-900 bg-white hover:bg-gray-100"
            >
              {draft.city ? 
                cities.find((city) => city.id === draft.city)?.name : 
                "Select city"
              }
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search cities..." />
              <CommandEmpty>No city found.</CommandEmpty>
              <CommandGroup>
                {cities.map((city) => (
                  <CommandItem
                    key={city.id}
                    value={city.name}
                    onSelect={() => {
                      setDraft(prev => ({ ...prev, city: city.id }));
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        draft.city === city.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {city.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Gender Select */}
        <Select
          value={draft.coachGender || "any"}
          onValueChange={(value) => {
            setDraft(prev => ({
              ...prev,
              coachGender: value as SearchFilters["coachGender"],
            }));
          }}
        >
          <SelectTrigger className="text-gray-900 bg-white hover:bg-gray-100">
            <SelectValue placeholder="Coach Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Gender</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>

        {/* Price Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Price Range</span>
            <span>${draft.maxPrice || 200}</span>
          </div>
          <Slider
            value={[draft.maxPrice || 200]}
            min={0}
            max={500}
            step={10}
            onValueChange={([value]) => {
              setDraft(prev => ({ ...prev, maxPrice: value }));
            }}
          />
        </div>

        {/* Sort Select */}
        <Select
          value={draft.sort || "match_desc"}
          onValueChange={(value) => {
            setDraft(prev => ({
              ...prev,
              sort: value as SearchFilters["sort"],
            }));
          }}
        >
          <SelectTrigger className="text-gray-900 bg-white hover:bg-gray-100">
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="match_desc">匹配度降序</SelectItem>
            <SelectItem value="price_asc">价格升序</SelectItem>
            <SelectItem value="price_desc">价格降序</SelectItem>
            <SelectItem value="updated_desc">最近更新</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters */}
        <AdvancedFilters
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={handleSubmit}
          onReset={handleReset}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between gap-4">
        <Button
          className="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200"
          onClick={handleSubmit}
        >
          搜索
        </Button>
        <Button
          variant="outline"
          className="text-gray-600 hover:text-gray-900"
          onClick={handleReset}
        >
          重置
        </Button>
      </div>
    </div>
  );
}