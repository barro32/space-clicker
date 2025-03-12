interface UIButtonProps {
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}

export function UIButton({ onClick, children, disabled }: UIButtonProps) {
  const baseClasses = "bg-green-500 dark:bg-green-700 text-white py-2 px-4 rounded text-lg transition-colors"
  const enabledClasses = "hover:bg-green-600 dark:hover:bg-green-800 cursor-pointer"
  const disabledClasses = "opacity-50 cursor-not-allowed"
  const combinedClasses = `${baseClasses} ${disabled ? disabledClasses : enabledClasses}`
  return (
    <button onClick={onClick} className={combinedClasses} disabled={disabled}>
      {children}
    </button>
  )
}
