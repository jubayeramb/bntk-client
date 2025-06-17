"use client";

export const PGLiteContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // This component is deprecated - now using API routes for database access
  // Return children directly to avoid breaking any existing usage
  return <>{children}</>;
};
