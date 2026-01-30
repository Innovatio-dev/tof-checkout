import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"

interface TofCheckboxProps {
  id: string
  label: string
  name: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const TofCheckbox = ({ id, label, name, checked, onCheckedChange }: TofCheckboxProps) => {
  return (
    <FieldGroup>
      <Field orientation="horizontal" className="cursor-pointer">
        <Checkbox
          id={id}
          name={name}
          className="cursor-pointer"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange?.(value === true)}
        />
        <FieldLabel htmlFor={id} className="cursor-pointer">
          {label}
        </FieldLabel>
      </Field>
    </FieldGroup>
  )
}

export default TofCheckbox
