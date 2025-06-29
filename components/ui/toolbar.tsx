"use client"

import * as React from "react"
import * as ToolbarPrimitive from "@radix-ui/react-toolbar"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const Toolbar = React.forwardRef<
  React.ElementRef<typeof ToolbarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToolbarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ToolbarPrimitive.Root
    ref={ref}
    className={cn(
      "flex items-center space-x-1",
      className
    )}
    {...props}
  />
))
Toolbar.displayName = ToolbarPrimitive.Root.displayName

const ToolbarSeparator = React.forwardRef<
  React.ElementRef<typeof ToolbarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ToolbarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ToolbarPrimitive.Separator
    ref={ref}
    className={cn("w-px h-6 bg-border", className)}
    {...props}
  />
))
ToolbarSeparator.displayName = ToolbarPrimitive.Separator.displayName

const toolbarButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-transparent hover:bg-accent hover:text-accent-foreground",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const ToolbarButton = React.forwardRef<
  React.ElementRef<typeof ToolbarPrimitive.Button>,
  React.ComponentPropsWithoutRef<typeof ToolbarPrimitive.Button> &
    VariantProps<typeof toolbarButtonVariants>
>(({ className, variant, size, ...props }, ref) => (
  <ToolbarPrimitive.Button
    ref={ref}
    className={cn(toolbarButtonVariants({ variant, size, className }))}
    {...props}
  />
))
ToolbarButton.displayName = ToolbarPrimitive.Button.displayName

const ToolbarLink = React.forwardRef<
  React.ElementRef<typeof ToolbarPrimitive.Link>,
  React.ComponentPropsWithoutRef<typeof ToolbarPrimitive.Link> &
    VariantProps<typeof toolbarButtonVariants>
>(({ className, variant, size, ...props }, ref) => (
  <ToolbarPrimitive.Link
    ref={ref}
    className={cn(toolbarButtonVariants({ variant, size, className }))}
    {...props}
  />
))
ToolbarLink.displayName = ToolbarPrimitive.Link.displayName

const ToolbarToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToolbarPrimitive.ToggleGroup>,
  React.ComponentPropsWithoutRef<typeof ToolbarPrimitive.ToggleGroup>
>(({ className, ...props }, ref) => (
  <ToolbarPrimitive.ToggleGroup
    ref={ref}
    className={cn("flex items-center", className)}
    {...props}
  />
))
ToolbarToggleGroup.displayName = ToolbarPrimitive.ToggleGroup.displayName

const ToolbarToggleItem = React.forwardRef<
  React.ElementRef<typeof ToolbarPrimitive.ToggleItem>,
  React.ComponentPropsWithoutRef<typeof ToolbarPrimitive.ToggleItem> &
    VariantProps<typeof toolbarButtonVariants>
>(({ className, variant, size, ...props }, ref) => (
  <ToolbarPrimitive.ToggleItem
    ref={ref}
    className={cn(
      toolbarButtonVariants({ variant, size }),
      "data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
      className
    )}
    {...props}
  />
))
ToolbarToggleItem.displayName = ToolbarPrimitive.ToggleItem.displayName

export {
  Toolbar,
  ToolbarSeparator,
  ToolbarButton,
  ToolbarLink,
  ToolbarToggleGroup,
  ToolbarToggleItem,
}