import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"

interface TofCheckboxProps {
  id: string
  label: string
  name: string
}

const TofCheckbox = ({ id, label, name }: TofCheckboxProps) => {
  return (
    <FieldGroup>
      <Field orientation="horizontal" className="cursor-pointer">
        <Checkbox id={id} name={name} className="cursor-pointer" />
        <FieldLabel htmlFor={id} className="cursor-pointer">
          {label}
        </FieldLabel>
      </Field>
    </FieldGroup>
  )
}

export default TofCheckbox
