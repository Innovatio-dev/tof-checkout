import Flag from "react-flagpack"

interface SnappFlagProps {
  code: string
  size?: string
  className?: string
}

const SnappFlag = ({ code, size = "l", className }: SnappFlagProps) => {
  return (
    <Flag
      code={code.toUpperCase()}
      size={size}
      hasBorder={true}
      className={`rounded-[5px] overflow-clip ${className}`}
      gradient="real-linear"
    />
  )
}

export default SnappFlag
