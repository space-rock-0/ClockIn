import styled, { keyframes } from "styled-components";
import type {TutorialStep} from "../../types/TutorialStep.ts";
import {useTutorial} from "../../constants/useTutorial.ts";

const pulse = keyframes`
    0%   { box-shadow: 0 0 0 0 rgba(75, 148, 219, 0.5); }
    70%  { box-shadow: 0 0 0 10px rgba(75, 148, 219, 0); }
    100% { box-shadow: 0 0 0 0 rgba(75, 148, 219, 0); }
`;

const Btn = styled.button`
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 500;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: white;
    border: 2.5px solid #4B94DB;
    color: #4B94DB;
    font-size: 1.2rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 12px rgba(75, 148, 219, 0.25);
    transition: transform 0.15s, background 0.15s;
    animation: ${pulse} 2.5s ease-out infinite;

    &:hover {
        background: #4B94DB;
        color: white;
        transform: scale(1.1);
    }
`;

interface Props {
    steps: TutorialStep[];
}

export default function TutorialButton({ steps }: Props) {
    const { setSteps, start } = useTutorial();

    return (
        <Btn onClick={() => { setSteps(steps); start(); }} title="How it works">
            ?
        </Btn>
    );
}