import styled from "styled-components";
import TrashIcon from "../icons/TrashIcon";

type TrashDropZoneProps = {
    label?: string;
    className?: string;
};

const Wrapper = styled.div`
    position: relative;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;

    &:hover svg {
        transform: scale(1.1);
    }

    &:hover span {
        opacity: 1;
        transform: translateX(0);
    }
`;

const StyledTrashIcon = styled(TrashIcon)`
    width: 6rem;
    height: 6rem;
    transition: transform 0.15s ease;
`;

const HoverText = styled.span`
    position: absolute;
    top: 110%;
    right: 0;
    transform: translateY(-6px);
    
    font-size: 0.9rem;
    color: #0e4f87;
    background: white;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);

    opacity: 0;
    transition: opacity 0.15s ease, transform 0.15s ease;

    pointer-events: none;
    white-space: nowrap;
`;

export function TrashDropZone({ label = "Delete Sticky Note", className }: TrashDropZoneProps) {
    return (
        <Wrapper className={className}>
            <StyledTrashIcon />
            <HoverText>{label}</HoverText>
        </Wrapper>
    );
}