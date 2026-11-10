import React from "react";

interface Props {
    className?: string;
    style?: React.CSSProperties;
}

export default function TutorialBeeIcon({ className, style }: Props) {
    return (
        <svg
            width="343" height="387" viewBox="0 0 343 387"
            fill="none" xmlns="http://www.w3.org/2000/svg"
            className={className} style={style}
        >
            <defs>
                <style>{`
          @keyframes bee-sway {
            0%   { transform: rotate(-6deg) translateY(0px); }
            50%  { transform: rotate(4deg) translateY(-6px); }
            100% { transform: rotate(-6deg) translateY(0px); }
          }
          .bee-root {
            transform-origin: 175px 257px;
            animation: bee-sway 3s ease-in-out infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .bee-root { animation: none; }
          }
        `}</style>
            </defs>

            <g className="bee-root">
                <rect y="177.006" width="18.0772" height="126.54" rx="9.0386"
                      transform="rotate(-64.4468 0 177.006)" fill="#4B94DB" />
                <rect width="18.0772" height="126.54" rx="9.0386"
                      transform="matrix(-0.824652 0.565641 0.565641 0.824652 53.9131 114)"
                      fill="#4B94DB" />
                <ellipse cx="55.0767" cy="82.0131" rx="55.0767" ry="82.0131"
                         transform="matrix(0.972103 -0.234553 0.420364 0.907355 62.502 26.1787)"
                         fill="#AFDBFF" />
                <ellipse cx="54.9192" cy="82.404" rx="54.9192" ry="82.404"
                         transform="matrix(0.968723 0.248145 -0.441347 0.897336 181.17 0)"
                         fill="#AFDBFF" />
                <path d="M294.291 282.519V232.13L343 253.966L294.291 282.519Z" fill="#4B94DB" />
                <circle cx="175.037" cy="257.325" r="129.331" fill="#FFF59A" />
                <ellipse cx="83.5" cy="253" rx="20.5" ry="21" fill="#4B94DB" />
                <path
                    d="M175.553 127.993C187.653 127.993 199.365 129.656 210.473 132.764C235.309 152.296 270.776 193.186 270.776 267.425C270.776 318.257 256.476 349.787 240.602 369.128C221.492 380.27 199.268 386.656 175.553 386.656C156.896 386.656 139.163 382.703 123.143 375.593C149.81 358.405 179.828 326.041 179.828 267.425C179.828 193.45 135.914 159.609 109.692 145.996C128.983 134.559 151.501 127.993 175.553 127.993Z"
                    fill="#4B94DB" />
            </g>
        </svg>
    );
}