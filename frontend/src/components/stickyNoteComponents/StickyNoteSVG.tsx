// src/components/stickyNoteComponents/StickyNoteSVG.tsx
import type { StickyNoteTheme } from "../../types/StickyNoteThemes";

type StickyNoteSVGProps = {
    theme: StickyNoteTheme;
    width?: number;
    height?: number;
    className?: string;
};

export default function StickyNoteSVG({
                                          theme,
                                          width = 292,
                                          height = 292,
                                          className,
                                      }: StickyNoteSVGProps) {
    // Original fold dimensions (from your SVG)
    const FOLD_ORIG_W = 90;
    const FOLD_ORIG_H = 68;
    const VIEWBOX_SIZE = 292;

    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 292 292"
            className={className}
            style={{ display: "block" }}
        >
            {/* base note */}
            <path
                d="M0 24C0 10.7452 10.7452 0 24 0H267.6C280.855 0 291.6 10.7452 291.6 24V236.877L201.527 291.455C201.371 291.55 201.192 291.6 201.009 291.6H24C10.7452 291.6 0 280.855 0 267.6V24Z"
                fill={theme.background}
            />

            {/* folded corner — positioned in viewBox coordinates */}
            <svg
                x={VIEWBOX_SIZE - FOLD_ORIG_W}
                y={VIEWBOX_SIZE - FOLD_ORIG_H}
                width={FOLD_ORIG_W}
                height={FOLD_ORIG_H}
                viewBox="0 0 91 69"
            >
                <path
                    d="M90.3118 13.8837C90.3118 13.8837 51.5339 -10.4137 44.0079 5.27763C36.4819 20.969 33.1654 25.7827 25.6394 38.1886C16.003 54.0734 0 68.8035 0 68.8035L90.3118 13.8837Z"
                    fill={theme.fold}
                />
            </svg>
        </svg>
    );
}