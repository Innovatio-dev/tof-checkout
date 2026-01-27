type InstructionItemProps = {
  number: number
  caption: string
}

const InstructionItem = ({ number, caption }: InstructionItemProps) => {
  return (
    <div className="flex items-center gap-2 text-white">
      <div className="flex items-center justify-center w-6 h-6 bg-neon-yellow rounded-full text-black text-sm font-semibold">
        {number}
      </div>
      <div className="text-lg font-semibold">{caption}</div>
    </div>
  )
}

export default InstructionItem
