import type { ReactNode } from "react";

interface LayoutProps {
    children: ReactNode;
    className?: string;
}

export const Layout = ({ children, className = "" }: LayoutProps) => {
    return (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
            {children}
        </div>
    );
};
