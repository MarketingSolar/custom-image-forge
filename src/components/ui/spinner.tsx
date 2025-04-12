
import React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "white";
}

export const Spinner = ({ 
  size = "md", 
  color = "primary",
  className, 
  ...props 
}: SpinnerProps) => {
  const sizeClass = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };
  
  const colorClass = {
    primary: "border-t-primary",
    secondary: "border-t-secondary",
    white: "border-t-white"
  };

  return (
    <div
      className={cn(
        "inline-block rounded-full animate-spin",
        colorClass[color],
        sizeClass[size],
        className
      )}
      {...props}
      aria-label="Loading"
      role="status"
    />
  );
};
