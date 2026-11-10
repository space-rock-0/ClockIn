import styled from "styled-components";
import AddIcon from "../icons/AddIcon";

type AddButtonProps = {
    onClick: () => void;
    label?: string;
    className?: string;
};

const Wrapper = styled.button`
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

const StyledAddIcon = styled(AddIcon)`
    width: 2.2rem;
    height: 2.2rem;
    transition: transform 0.15s ease;
`;

const HoverText = styled.span`
  position: absolute;
  left: 2.6rem;
  top: 10%;
  transform: translateY(-50%) translateX(-6px);

  font-size: 0.85rem;
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

export function AddButton({ onClick, label = "Add", className }: AddButtonProps) {
    return (
        <Wrapper className={className} onClick={onClick}>
            <StyledAddIcon />
            <HoverText>{label}</HoverText>
        </Wrapper>
    );
}