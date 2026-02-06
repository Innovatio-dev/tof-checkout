"use client"

import * as React from "react"
import { Check, ChevronsUpDown, InfoIcon, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { countries } from "@/lib/countries"
import SnappFlag from './snapp-flag'

interface CountryComboboxProps {
    onChange: (value: string) => void
    isLocked?: boolean
    defaultValue?: string
    className?: string
}

const CountryCombobox = ({ onChange, isLocked = false, defaultValue = "", className = "" }: CountryComboboxProps) => {
  const [open, setOpen] = React.useState(false)
  const orderedCountries = React.useMemo(() => {
    const unitedStatesIndex = countries.findIndex((country) => country.code === "us")
    if (unitedStatesIndex <= 0) {
      return countries
    }
    const reordered = [...countries]
    const [unitedStates] = reordered.splice(unitedStatesIndex, 1)
    reordered.unshift(unitedStates)
    return reordered
  }, [])
  const normalizedDefaultValue = defaultValue.trim().toLowerCase()
  const resolvedDefaultCode =
    orderedCountries.find(
      (country) =>
        country.code === normalizedDefaultValue ||
        country.value.toLowerCase() === normalizedDefaultValue ||
        country.label.toLowerCase() === normalizedDefaultValue
    )?.code ?? orderedCountries[0]?.code ?? normalizedDefaultValue
  const [value, setValue] = React.useState(resolvedDefaultCode)

  React.useEffect(() => {
    if (!resolvedDefaultCode) {
      return
    }
    if (!value) {
      setValue(resolvedDefaultCode)
      onChange(resolvedDefaultCode)
      return
    }
    if (isLocked && value !== resolvedDefaultCode) {
      setValue(resolvedDefaultCode)
      onChange(resolvedDefaultCode)
    }
  }, [isLocked, onChange, resolvedDefaultCode, value])

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={!isLocked && open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            role="combobox"
            aria-expanded={open}
            disabled={isLocked}
            className={cn(
              "w-full justify-between text-sm font-normal",
              isLocked && "opacity-50 cursor-not-allowed bg-gray-100"
            )}
          >
            {value ? (
              <span className="flex items-center gap-2">
                <SnappFlag code={value.toUpperCase()} />
                {orderedCountries.find((country) => country.code === value)?.label}
              </span>
            ) : (
              "Select country"
            )}
            {!isLocked && <ChevronsUpDown className="opacity-30" />}
          </Button>
        </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-300 border-gray-800 rounded-lg" onOpenAutoFocus={e => e.preventDefault()}>
        <Command className="w-full bg-dark text-white">
          <CommandInput placeholder="Search country..." className="h-10 text-[16px]" />
          <CommandList>
            <CommandEmpty>
              <div className="text-gray-400 flex items-center justify-center gap-2 p-4">
                <InfoIcon className="w-5 h-5" />
                No country found
              </div>
            </CommandEmpty>
            <CommandGroup>
              {orderedCountries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.value}
                  className="text-white/80"
                  onSelect={(currentValue) => {
                    const selected = orderedCountries.find(
                      (item) => item.value === currentValue
                    )
                    const selectedCode = selected?.code ?? ""
                    setValue(selectedCode === value ? "" : selectedCode)
                    onChange(selectedCode === value ? "" : selectedCode)
                    setOpen(false)
                  }}
                >
                  <SnappFlag code={country.code} />
                  {country.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    {isLocked && (
      <Lock
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        size={16}
        color="hsla(0, 0%, 41%, 1)"
      />
    )}
    </div>
  )
}

export default CountryCombobox
