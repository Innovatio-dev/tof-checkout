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
  const [value, setValue] = React.useState(defaultValue)

  React.useEffect(() => {
    if (isLocked && defaultValue && value !== defaultValue) {
      setValue(defaultValue)
      onChange(defaultValue)
    }
  }, [isLocked, defaultValue])

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
                {countries.find((country) => country.code === value)?.label}
              </span>
            ) : (
              "Select country"
            )}
            {!isLocked && <ChevronsUpDown className="opacity-30" />}
          </Button>
        </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-300 border-gray-800 rounded-lg" onOpenAutoFocus={e => e.preventDefault()}>
        <Command className="w-full bg-dark text-white">
          <CommandInput autoFocus placeholder="Search country..." className="h-10 text-[16px]" />
          <CommandList>
            <CommandEmpty>
              <div className="text-gray-400 flex items-center justify-center gap-2 p-4">
                <InfoIcon className="w-5 h-5" />
                No country found
              </div>
            </CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.value}
                  className="text-white/80"
                  onSelect={(currentValue) => {
                    const selected = countries.find(
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
