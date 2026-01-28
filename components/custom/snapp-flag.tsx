import Flag from "react-flagpack"

interface SnappFlagProps {
  code: string
  size?: string
  className?: string
}

const SnappFlag = ({ code, size = "m", className }: SnappFlagProps) => {
  return (
    <Flag
      code={code.toUpperCase()}
      size={size}
      hasBorder={false}
      className={`rounded-[3px] overflow-clip border border-gray-200 ${className}`}
      gradient="real-linear"
    />
  )
}

export default SnappFlag
