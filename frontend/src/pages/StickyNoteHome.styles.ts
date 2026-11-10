import styled from "styled-components";
import HomepageBlankIcon from "../components/icons/HomepageBlankIcon";

export const PageTitle = styled.h1`
    text-align: center;
    font-size: clamp(0.8rem, 3rem, 4rem);
    margin: 1rem 0 0;
    color: white;

    [data-theme="dark"] & {
        color: black;
    }
`

export const PageWrapper = styled.div`
    min-height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

export const NotesAndButtonsLayout = styled.div`
    display: flex;
    width: 100%;

    flex: 1;
    align-items: stretch;
    
    gap: 20px;
    padding: 0 2rem 0.5rem 0;
`;

export const NotesBoard = styled.div`
    flex: 11;
    //border: 4px solid white;

    position: relative;
    overflow: visible;

    padding: 0.5rem 1rem 0.5rem;
    margin-left: 0.5rem;

    min-height: 60vh;
    z-index: 0;
`;

export const ActionColumn = styled.div`
    flex: 1;
    display: flex; 
    flex-direction: column;
    align-items: center; 
    justify-content: center;
    gap: 20vh;

    min-height: 60vh;

    padding: 2rem 0;
    position: relative;
    z-index: 10;
`

export const Overlay = styled.div`
    position: fixed;
    inset: 0;
    
    height: 100vh;
    width: 100vw;

    background: rgba(28, 77, 119, 0.5);
    backdrop-filter: blur(6px);

    display: flex;
    justify-content: center;
    align-items: center;
    
    z-index: 1000;
`;

export const OverlayContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap: 20px;

  width: 100%;
  max-width: 500px;

  position: relative;
`;

export const BottomActions = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  gap: 16px;

  margin-top: 12px;
`;

export const AddAndSelectWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    
    width: 100%;
    margin: 0.3rem 0;
`;

export const OverlayButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
`;

export const SaveButton = styled.button`
  padding: 10px 18px;
  font-size: 1rem;
`;

export const CancelButton = styled.button`
  padding: 10px 18px;
  font-size: 1rem;
`;

export const DeleteButton = styled.button`
  padding: 10px 18px;
  font-size: 1rem;
`;

export const Background = styled(HomepageBlankIcon)`
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -2;
`;

export const BackgroundOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: -1;
`;


// Save/cancel buttons on sticky note overlay
export const IconButton = styled.button`
    background: transparent;
    border: none;
    cursor: pointer;
    
    display: flex;
    align-items: center;
    justify-content: center;
    
    padding: 6px;
    border-radius: 8px;
    
    color: white;
    opacity: 0.8;
    
    transition: all 0.15s ease;

    svg {
        width: 22px;
        height: 22px;
    }
    
    &:hover {
    opacity: 1;
    transform: scale(1.1);
    }
`;