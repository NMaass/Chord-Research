import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export interface ResearchShellProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ResearchShell(props: ResearchShellProps): ReactNode;

export interface ResearchHeaderProps {
  title: ReactNode;
  homeHref?: string;
  children?: ReactNode;
  className?: string;
}

export function ResearchHeader(props: ResearchHeaderProps): ReactNode;

export interface ResearchNavItem {
  id: string;
  label: ReactNode;
}

export interface ResearchNavProps {
  items: ResearchNavItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}

export function ResearchNav(props: ResearchNavProps): ReactNode;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "quiet" | "primary";
}

export function Button(props: ButtonProps): ReactNode;

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>): ReactNode;

export interface StatusMessageProps {
  variant?: "info" | "success" | "error";
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function StatusMessage(props: StatusMessageProps): ReactNode;

export interface ProgressMeterProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

export function ProgressMeter(props: ProgressMeterProps): ReactNode;

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: "sm" | "md" | "lg";
}

export function Stack(props: StackProps): ReactNode;
