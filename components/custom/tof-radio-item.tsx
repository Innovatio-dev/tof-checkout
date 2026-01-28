import { RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

type TofRadioItemProps = {
  id: string
  value: string
  label: string
}

const TofRadioItem = ({ id, value, label }: TofRadioItemProps) => {
  return (
    <div>
      <RadioGroupItem value={value} id={id} className="sr-only peer" />
      <label
        htmlFor={id}
        className={cn(
          "flex sm:h-11 h-14 items-center justify-center leading-tight! text-center rounded-md border cursor-pointer",
          "border-white/10 bg-white/10 px-4 text-sm font-semibold text-white/70",
          "transition-colors hover:border-white/40 hover:bg-white/15",
          "peer-data-[state=checked]:border-white",
          "peer-data-[state=checked]:bg-white peer-data-[state=checked]:text-black",
          "peer-data-[state=checked]:hover:bg-white peer-data-[state=checked]:hover:text-black"
        )}
      >
        {label}
      </label>
    </div>
  )
}

export default TofRadioItem
