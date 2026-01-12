"use client";

import Image from "next/image";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function Logo({ width = 64, height = 64, className }: LogoProps) {
  return (
    <span className={`inline-flex relative ${className || ""}`}>
      <Image
        src="/logo-light.svg"
        alt="Byakoron Logo"
        width={width}
        height={height}
        className="hidden dark:block"
        priority
      />
      <Image
        src="/logo-dark.svg"
        alt="Byakoron Logo"
        width={width}
        height={height}
        className="block dark:hidden"
        priority
      />
    </span>
  );
}
