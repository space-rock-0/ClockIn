import styled from "styled-components";
import ClockIcon from "../icons/ClockIcon";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/Routes";

const Wrapper = styled.div`
    position: absolute;
    width: 13%;
    top: 55%;
    left: 11%;
    transform: scale(1.2);
    cursor: pointer;

    & * {
        pointer-events: none;
    }

    &:hover::after {
        content: "Timer";
        position: absolute;
        bottom: 5px;
        left: 60%;
        transform: translateX(-50%);
        background: white;
        color: #4B94DB;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 1.2rem;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 0 8px rgba(255, 255, 255, 1),
        0 0 16px rgba(255, 255, 255, 0.9),
        0 0 32px rgba(255, 255, 255, 0.7),
        0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 1000;
    }
`;

const StyledClock = styled(ClockIcon)`
    width: 100%;
    height: auto;
    display: block;

    [data-theme="dark"] & path[fill="#AFDBFF"] { fill: #494264; }
    [data-theme="dark"] & path[fill="#4B94DB"] { fill: #272336; }
    [data-theme="dark"] & path[fill="#0E4F87"]:not(.digit) { fill: #272336; }
    path.digit { display: none; }
    [data-theme="dark"] & .digit { fill: #ffffff; }
    [data-theme="dark"] & path[fill="#D9D9D9"] { fill: #5c5270; }
`;

const StyledLink = styled(Link)`
    position: absolute;
    inset: 0;
    cursor: pointer;
    z-index: 100;
    pointer-events: all;
`;

export default function ClockObject() {
    return (
        <Wrapper data-tutorial="clock">
            <StyledClock />
            <StyledLink to={ROUTES.TIMER_ENTRY_PAGE} />
        </Wrapper>
    );
}
