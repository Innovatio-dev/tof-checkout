interface FormSectionProps {
  title: string
  children: React.ReactNode
}

const FormSection = ({ title, children }: FormSectionProps) => {
  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-md font-semibold">{title}</h4>
      {children}
    </div>
  )
}

export default FormSection