interface WarningIconProps {
    size?: number;
    style?: React.CSSProperties;
    className?: string;
}

export default function WarningIcon({ size = 20, style, className }: WarningIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 67 67"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Not schedulable"
            style={style}
            className={className}
        >
            <circle cx="33.5" cy="33.5" r="33.5" fill="white" />
            <path
                d="M33.5 0C52.0015 0 67 14.9985 67 33.5C67 52.0015 52.0015 67 33.5 67C14.9985 67 0 52.0015 0 33.5C0 14.9985 14.9985 0 33.5 0ZM33 46C29.6863 46 27 48.6863 27 52C27 55.3137 29.6863 58 33 58C36.3137 58 39 55.3137 39 52C39 48.6863 36.3137 46 33 46ZM33 8C29.6863 8 27 10.6863 27 14V37C27 40.3137 29.6863 43 33 43C36.3137 43 39 40.3137 39 37V14C39 10.6863 36.3137 8 33 8Z"
                fill="#D45884"
            />
        </svg>
    );
}