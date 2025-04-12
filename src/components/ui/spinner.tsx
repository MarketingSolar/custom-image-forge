
import React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export const Spinner = ({ 
  size = "md", 
  className, 
  ...props 
}: SpinnerProps) => {
  const sizeClass = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  return (
    <div
      className={cn(
        "inline-block rounded-full border-t-primary animate-spin",
        sizeClass[size],
        className
      )}
      {...props}
    />
  );
};
