import styled from "styled-components"
import PotIcon from "../icons/PotIcon"
import {ROUTES} from "../../constants/Routes.ts";
import {Link} from "react-router-dom";

const Wrapper = styled.div`
    position: absolute;
    width: 8%;
    top: 5%;
    left: 72%;
    transform: scale(2);

    & * {
        pointer-events: none;
    }

    &:hover::after {
        content: "Garden";
        position: absolute;

        top: 105%;          /* place below */
        left: 50%;          /* center anchor */
        transform: translateX(-50%);

        background: white;
        color: #4B94DB;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        white-space: nowrap;

        box-shadow:
                0 0 8px rgba(255, 255, 255, 1),
                0 0 16px rgba(255, 255, 255, 0.9),
                0 0 32px rgba(255, 255, 255, 0.7),
                0 2px 8px rgba(0, 0, 0, 0.15);

        z-index: 1000;
    }
`;

const StyledPot = styled(PotIcon)`
    width: 100%;
    height: auto;
    display: block;

    [data-theme="dark"] & path[fill="#4B94DB"],
    [data-theme="dark"] & path[fill="#4B94DB"][stroke="#4B94DB"] { fill: #272336; }
    [data-theme="dark"] & path[fill="#F2F2F2"],
    [data-theme="dark"] & rect[fill="#F2F2F2"] { fill: #7a7099; }
    [data-theme="dark"] & path[fill="#3D9D8B"] { fill: #212c2c; }
    [data-theme="dark"] & path[fill="#C0E8AA"] { fill: #485d50; }
    [data-theme="dark"] & path[fill="#D45884"] { fill: #7e3f61; }
    [data-theme="dark"] & path[fill="#733047"] { fill: #3f2136; }
`;

const StyledLink = styled(Link)`
    position: absolute;
    inset: 0;
    cursor: pointer;
    z-index: 100;
    pointer-events: all;
`;

export default function PotObject() {
    return (
        <Wrapper data-tutorial="pot">
            <StyledPot />
            <StyledLink to={ROUTES.GARDEN} />
        </Wrapper>
    );
}