import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type Option = {
  value: string
  label: string
}

interface ComboboxProps {
  options: Option[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  onSearch?: (query: string) => void
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  onSearch,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? ""

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (onSearch) {
      onSearch(query)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700" align="start">
        <Command className="bg-gray-800" shouldFilter={!onSearch}>
          <CommandInput 
            placeholder="Search..." 
            className="text-white placeholder:text-gray-400"
            value={searchQuery}
            onValueChange={handleSearch}
          />
          <CommandEmpty className="text-gray-400 py-6 text-center text-sm">No option found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => {
                  onChange(option.value)
                  setOpen(false)
                  setSearchQuery("")
                }}
                className="text-white hover:bg-gray-700 focus:bg-gray-700"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}