import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--coffee-medium)",
          "--normal-text": "var(--coffee-text)",
          "--normal-border": "var(--coffee-light)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
