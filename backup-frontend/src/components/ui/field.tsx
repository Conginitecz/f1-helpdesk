import { cloneElement, isValidElement, useId, type InputHTMLAttributes, type ReactElement, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

/*
 * Form controls - DESIGN.md "Components / Form Inputs & Checkboxes":
 *   Input fields  36px tall, white background, 1px #D9E3EA border, #172B4D
 *                 text, 4px radius. Focus: #2563EB border with a 2px
 *                 rgba(37, 99, 235, 0.15) halo. Vertical interior padding is
 *                 space-sm (8px), per the spacing scale.
 *   Checkboxes    16x16, 1px #D9E3EA border, #2563EB when active, 2px radius.
 *
 * Field is the label/hint/error wrapper every control shares, so a form never
 * re-invents the help text or the error announcement: errors are announced
 * through role="alert" and tied to the control with aria-describedby.
 */

const controlClasses =
  "block h-9 w-full rounded-control border border-border-subtle bg-surface-card px-space-sm font-body text-body-md text-text-primary placeholder:text-text-muted transition focus:border-info-blue focus:outline-none focus:shadow-[0_0_0_2px_rgba(37,99,235,0.15)] disabled:cursor-not-allowed disabled:bg-surface-base disabled:text-text-muted";

const controlErrorClasses =
  "border-error-alert focus:border-error-alert focus:shadow-[0_0_0_2px_rgba(239,68,68,0.15)]";

interface FieldProps {
  label: string;
  /** Control id; generated when omitted. */
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

/** Label + control + hint/error wrapper. */
export function Field({ label, htmlFor, hint, error, required, children }: FieldProps) {
  const generatedId = useId();
  const controlId = htmlFor ?? generatedId;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label className="mb-1 block font-body text-label-md font-medium text-text-primary" htmlFor={controlId}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-error-alert">
            *
          </span>
        ) : null}
      </label>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<Record<string, unknown>>, {
            id: controlId,
            "aria-describedby": describedBy || undefined,
            "aria-invalid": error ? true : undefined,
          })
        : children}
      {hint && !error ? (
        <p className="mt-1 font-body text-body-sm text-text-muted" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="mt-1 font-body text-body-sm text-error-alert" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  hint?: string;
  error?: string;
}

/** Labelled single-line input. */
export function TextField({ label, hint, error, required, className = "", ...props }: TextFieldProps) {
  return (
    <Field error={error} hint={hint} label={label} required={required}>
      <input
        className={`${controlClasses} ${error ? controlErrorClasses : ""} ${className}`}
        required={required}
        {...props}
      />
    </Field>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
}

/** Labelled select. Options are passed as children. */
export function SelectField({ label, hint, error, required, className = "", children, ...props }: SelectFieldProps) {
  return (
    <Field error={error} hint={hint} label={label} required={required}>
      <select
        className={`${controlClasses} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22%2364748B%22><path d=%22M4 6l4 4 4-4%22/></svg>')] bg-[right_8px_center] bg-no-repeat pr-space-lg ${error ? controlErrorClasses : ""} ${className}`}
        required={required}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

/** Labelled multi-line input. */
export function TextareaField({ label, hint, error, required, className = "", ...props }: TextareaFieldProps) {
  return (
    <Field error={error} hint={hint} label={label} required={required}>
      <textarea
        className={`${controlClasses} h-auto min-h-[76px] py-space-sm ${error ? controlErrorClasses : ""} ${className}`}
        required={required}
        {...props}
      />
    </Field>
  );
}

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label: string;
}

/** 16px checkbox with its label, per the spec's checkbox treatment. */
export function Checkbox({ label, className = "", ...props }: CheckboxProps) {
  return (
    <label className={`inline-flex items-center gap-space-sm font-body text-body-md text-text-primary ${className}`}>
      <input
        className="size-4 rounded-[2px] border border-border-subtle accent-info-blue"
        type="checkbox"
        {...props}
      />
      {label}
    </label>
  );
}