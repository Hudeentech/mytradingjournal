import React from "react";

export function Card({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-2xl bg-white/90 border border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 pt-6 pb-2 ${className}`} {...props}>{children}</div>
  );
}

export function CardTitle({ children, className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={`text-xl font-bold mb-1 ${className}`} {...props}>{children}</h2>
  );
}

export function CardDescription({ children, className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-gray-500 text-sm mb-2 ${className}`} {...props}>{children}</p>
  );
}

export function CardContent({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 pb-4 ${className}`} {...props}>{children}</div>
  );
}

export function CardFooter({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 pb-4 pt-2 border-t border-gray-100 ${className}`} {...props}>{children}</div>
  );
}
