import styled, {keyframes} from "styled-components";
import TrashIcon from "../icons/TrashIcon.tsx";
import OpenTrashIcon from "../icons/OpenTrashIcon.tsx";

const Wrapper = styled.div`
    position: relative;
    width: 90px;
    height: 90px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
        width: 60px;
        height: 60px;
    }
`;

const rippleFast = keyframes`
    0%   { transform: scale(1);    opacity: 0.5; }
    100% { transform: scale(2.2);  opacity: 0;   }
`;

const rippleSlow = keyframes`
    0%   { transform: scale(1);    opacity: 0.4; }
    100% { transform: scale(2.2);  opacity: 0;   }
`;
const INNER_SIZE = 60 * 1.1;   // just barely covers the icon
const OUTER_SIZE = INNER_SIZE * 0.95;  // 90% bigger than inner

const Ring = styled.div<{ $visible: boolean; $size: number; $duration: string }>`
    position: absolute;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border-radius: 50%;
    background: ${({ $duration }) =>
    $duration === "slow"
        ? "rgba(255, 255, 255, 0.38)"   // inner — slightly brighter
        : "rgba(255, 255, 255, 0.25)"}; // outer — as specified
    animation: ${({ $duration }) => $duration === "fast" ? rippleFast : rippleSlow}
    ${({ $duration }) => $duration === "fast" ? "1.2s" : "1.8s"}
    ease-out infinite;
    animation-play-state: ${({ $visible }) => ($visible ? "running" : "paused")};
    visibility: ${({ $visible }) => ($visible ? "visible" : "hidden")};  /* ← fixes always-visible bug */
    z-index: 0;
`;

const IconSlot = styled.div<{ $visible: boolean }>`
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: ${({ $visible }) => ($visible ? 1 : 0)};
    transform: ${({ $visible }) => ($visible ? "scale(1)" : "scale(0.85)")};
    transition: opacity 0.2s ease, transform 0.2s ease;
`;

const Tooltip = styled.div<{ $visible: boolean }>`
    position: absolute;
    top: 110%; /* sits above the icon */
    right: 0;

    transform: ${({ $visible }) =>
            $visible ? "translateY(0)" : "translateY(-4px)"};

    background: white;
    color: #4B94DB;
    font-size: 1.25rem;
    font-weight: 600;
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    white-space: nowrap;

    opacity: ${({ $visible }) => ($visible ? 1 : 0)};
    pointer-events: none;

    transition: all 0.15s ease;
    z-index: 10;
`;

type Props = {
    isHovered: boolean;
    isActive: boolean;
};


export default function TrashDropZone({ isHovered, isActive }: Props) {
    return (
        <Wrapper>

            <Tooltip $visible={isHovered}>
                Delete Sticky Note
            </Tooltip>
            <Ring $visible={isActive || isHovered} $size={OUTER_SIZE} $duration="fast" />
            <Ring $visible={isActive || isHovered} $size={INNER_SIZE} $duration="slow" />

            <IconSlot $visible={!isHovered}>
                <TrashIcon />
            </IconSlot>
            <IconSlot $visible={isHovered}>
                <OpenTrashIcon />
            </IconSlot>
        </Wrapper>
    );
}