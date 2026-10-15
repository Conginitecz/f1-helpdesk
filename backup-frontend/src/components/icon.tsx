import { ICON_CODEPOINTS } from "@/styles/icon-codepoints";

/*
 * Icon - the single entry point for every glyph in the product.
 *
 * Names are the Material Symbols ligature names used throughout docs/design
 * (dashboard, handshake, inventory_2, ...). Each is resolved to a private-use
 * codepoint from the generated map and painted by the self-hosted subset in
 * public/fonts, declared in src/styles/icons.css.
 *
 * Deliberately not a ligature-font lookup: the subset drops the GSUB ligature
 * rules to stay small, so the name is only ever a lookup key. That also means a
 * typo cannot leak an icon name into the UI as visible text - it renders
 * nothing, and in development it warns instead.
 */

export type IconName = keyof typeof ICON_CODEPOINTS | (string & {});

interface IconProps {
  /** Material Symbols ligature name, for example "dashboard". */
  name: IconName;
  /** Rendered size in px. Defaults to 20, the size used in design headers. */
  size?: number;
  className?: string;
}

export function Icon({ name, size = 20, className }: IconProps) {
  const glyph = ICON_CODEPOINTS[name];

  if (!glyph && process.env.NODE_ENV !== "production") {
    // Development-only signal: the design reference and the font subset are
    // generated from different sources, so a newly designed icon needs
    // scripts/build-icon-font.py re-run before it can render.
    console.warn(
      `[Icon] "${name}" is not in the icon font subset. Run scripts/build-icon-font.py.`,
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`f1-icon${className ? ` ${className}` : ""}`}
      style={{ fontSize: `${size}px`, width: `${size}px`, height: `${size}px` }}
    >
      {glyph ?? ""}
    </span>
  );
}
