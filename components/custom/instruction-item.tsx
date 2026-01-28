type InstructionItemProps = {
  number: number
  caption: string
}

const InstructionItem = ({ number, caption }: InstructionItemProps) => {
  return (
    <div className="flex items-center gap-2 text-white">
      <div className="flex items-center justify-center w-6 h-6 shrink-0 bg-neon-yellow rounded-full text-black text-sm font-semibold">
        {number}
      </div>
      <div className="md:text-lg text-base font-semibold leading-tight">{caption}</div>
    </div>
  )
}

export default InstructionItem
