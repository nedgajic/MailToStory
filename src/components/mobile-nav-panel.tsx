"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";

function useMobileNavScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

type MobileNavPanelProps = {
  open: boolean;
  onClose: () => void;
  label?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function MobileNavSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mkt-mobile-nav__section">
      <p className="mkt-mobile-nav__section-label">{label}</p>
      <div className="mkt-mobile-nav__links">{children}</div>
    </div>
  );
}

export function MobileNavPanel({
  open,
  onClose,
  label = "Menu",
  children,
  footer,
}: MobileNavPanelProps) {
  useMobileNavScrollLock(open);
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="mkt-mobile-nav__backdrop"
        onClick={onClose}
        aria-label="Close menu"
        tabIndex={-1}
      />
      <div className="mkt-container mkt-mobile-nav__wrap">
        <nav className="mkt-mobile-nav" aria-label={label}>
          {children}
          {footer ? (
            <div className="mkt-mobile-nav__footer">{footer}</div>
          ) : null}
        </nav>
      </div>
    </>
  );
}

type MobileNavItemProps = {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  href?: string;
};

export function MobileNavItem({
  active = false,
  children,
  onClick,
  href,
}: MobileNavItemProps) {
  const className = [
    "mkt-mobile-nav__item",
    active && "mkt-mobile-nav__item--active",
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  );
}
