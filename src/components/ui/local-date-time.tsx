"use client";

type Props = {
  value: string | Date;
  locale?: string;
  fallback?: string;
};

export function LocalDateTime({ value, locale, fallback = "-" }: Props) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return <>{fallback}</>;
  }

  return <>{date.toLocaleString(locale)}</>;
}
