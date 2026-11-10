import { Link } from "react-router-dom";
import styled from "styled-components";
import { BackIcon } from "../icons/BackIcon";
import React from "react";

type BackButtonProps = {
    to?: string;
    label?: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
};

const sharedStyles = `
    position: fixed;
    top: 1.5rem;
    left: 1.5rem;

    display: inline-flex;
    align-items: center;
    gap: 0.4rem;

    text-decoration: none;
    color: white;

    z-index: 1000;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;

    &:hover svg {
        transform: scale(1.08);
    }

    &:hover span {
        opacity: 1;
        transform: translateX(0);
    }
`;

const BackLink = styled(Link)`${sharedStyles}`;
const BackBtn = styled.button`${sharedStyles}`;

const StyledBackIcon = styled(BackIcon)`
    width: 2.2rem;
    height: 2.2rem;
`;

const HoverText = styled.span`
    font-size: 0.9rem;
    color: #0e4f87;

    opacity: 0;
    transform: translateX(-4px);
    transition: opacity 0.15s ease, transform 0.15s ease;

    pointer-events: none;
`;

export default function BackButton({ to, label = "Home", className, style, onClick }: BackButtonProps) {
    if (onClick || !to) {
        return (
            <BackBtn className={className} style={style} onClick={onClick}>
                <StyledBackIcon />
                <HoverText>{label}</HoverText>
            </BackBtn>
        );
    }
    return (
        <BackLink to={to} className={className} style={style}>
            <StyledBackIcon />
            <HoverText>{label}</HoverText>
        </BackLink>
    );
}