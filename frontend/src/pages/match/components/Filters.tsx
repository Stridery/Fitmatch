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
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Find Your Perfect Coach</h2>
        <p className="text-gray-400">Filter courses to discover the best training experience</p>
      </div>

      {/* Filter Cards Container */}
      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Sport Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Sport</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="justify-between text-white bg-gray-700/50 border-gray-600 hover:bg-gray-600/50 hover:border-gray-500 w-full"
                >
                  {selectedSport ? selectedSport.name : "Select sport"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 bg-gray-800 border-gray-700">
                <Command>
                  <CommandInput placeholder="Search sports..." className="text-white" />
                  <CommandEmpty className="text-gray-400">No sport found.</CommandEmpty>
                  <CommandGroup>
                    {sports.map((sport) => (
                      <CommandItem
                        key={sport.id}
                        value={sport.name}
                        onSelect={() => {
                          setDraft(prev => ({ ...prev, sport: sport.name.toLowerCase() }));
                        }}
                        className="text-white hover:bg-gray-700"
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
          </div>

          {/* City Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Location</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="justify-between text-white bg-gray-700/50 border-gray-600 hover:bg-gray-600/50 hover:border-gray-500 w-full"
                >
                  {draft.city ? 
                    cities.find((city) => city.id === draft.city)?.name : 
                    "Select city"
                  }
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 bg-gray-800 border-gray-700">
                <Command>
                  <CommandInput placeholder="Search cities..." className="text-white" />
                  <CommandEmpty className="text-gray-400">No city found.</CommandEmpty>
                  <CommandGroup>
                    {cities.map((city) => (
                      <CommandItem
                        key={city.id}
                        value={city.name}
                        onSelect={() => {
                          setDraft(prev => ({ ...prev, city: city.id }));
                        }}
                        className="text-white hover:bg-gray-700"
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
          </div>

          {/* Gender Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Coach Gender</label>
            <Select
              value={draft.coachGender || "any"}
              onValueChange={(value) => {
                setDraft(prev => ({
                  ...prev,
                  coachGender: value as SearchFilters["coachGender"],
                }));
              }}
            >
              <SelectTrigger className="text-white bg-gray-700/50 border-gray-600 hover:bg-gray-600/50 hover:border-gray-500">
                <SelectValue placeholder="Coach Gender" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="any" className="text-white hover:bg-gray-700">Any Gender</SelectItem>
                <SelectItem value="male" className="text-white hover:bg-gray-700">Male</SelectItem>
                <SelectItem value="female" className="text-white hover:bg-gray-700">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Price Range</label>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>$0</span>
                <span className="text-white font-medium">${draft.maxPrice || 200}</span>
                <span>$500</span>
              </div>
              <Slider
                value={[draft.maxPrice || 200]}
                min={0}
                max={500}
                step={10}
                onValueChange={([value]) => {
                  setDraft(prev => ({ ...prev, maxPrice: value }));
                }}
                className="[&_.slider-track]:bg-gray-600 [&_.slider-range]:bg-white [&_.slider-thumb]:bg-white [&_.slider-thumb]:border-gray-400"
              />
            </div>
          </div>

          {/* Sort Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Sort By</label>
            <Select
              value={draft.sort || "match_desc"}
              onValueChange={(value) => {
                setDraft(prev => ({
                  ...prev,
                  sort: value as SearchFilters["sort"],
                }));
              }}
            >
              <SelectTrigger className="text-white bg-gray-700/50 border-gray-600 hover:bg-gray-600/50 hover:border-gray-500">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="match_desc" className="text-white hover:bg-gray-700">Best Match</SelectItem>
                <SelectItem value="price_asc" className="text-white hover:bg-gray-700">Price: Low to High</SelectItem>
                <SelectItem value="price_desc" className="text-white hover:bg-gray-700">Price: High to Low</SelectItem>
                <SelectItem value="updated_desc" className="text-white hover:bg-gray-700">Recently Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-4">
          <Button
            className="bg-white hover:bg-gray-100 text-black px-8 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 transform"
            onClick={handleSubmit}
          >
            Search Courses
          </Button>
          <AdvancedFilters
            draft={draft}
            onDraftChange={setDraft}
            onSubmit={handleSubmit}
            onReset={handleReset}
          />
          <Button
            variant="outline"
            className="bg-transparent text-gray-300 border-gray-600 hover:bg-gray-800 hover:text-white hover:border-gray-500 px-8 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 transform"
            onClick={handleReset}
          >
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
}