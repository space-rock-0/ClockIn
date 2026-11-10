import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;

const slideUp = keyframes`
    from { opacity: 0; transform: translateY(24px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
`;

export const ModalBackdrop = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: ${fadeIn} 0.2s ease;
`;

export const ModalCard = styled.div`
    background: #fffdf5;
    border-radius: 16px;
    padding: 32px;
    width: min(950px, 95vw);
    max-height: 85vh;
    overflow-y: auto;
    box-shadow:
            0 4px 6px rgba(0,0,0,0.05),
            0 20px 60px rgba(0,0,0,0.18);
    animation: ${slideUp} 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

export const ModalTitle = styled.h2`
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0;
    letter-spacing: -0.02em;
`;

export const ModalSubtitle = styled.p`
    font-size: 0.875rem;
    color: #888;
    margin: 8px 0 0;
`;

export const ModalActions = styled.div`
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding-top: 4px;
`;

export const ConfirmButton = styled.button<{ disabled?: boolean }>`
    background: ${p => p.disabled ? "#ccc" : "#1a1a1a"};
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 10px 22px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: ${p => p.disabled ? "not-allowed" : "pointer"};
    transition: background 0.15s, transform 0.1s;

    &:hover {
        background: ${p => p.disabled ? "#ccc" : "#333"};
        transform: ${p => p.disabled ? "none" : "translateY(-1px)"};
    }

    &:active {
        transform: translateY(0);
    }
`;

export const CancelButton = styled.button`
    background: transparent;
    color: #888;
    border: 1.5px solid #e8e4d8;
    border-radius: 8px;
    padding: 10px 22px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;

    &:hover {
        border-color: #bbb;
        color: #555;
    }
`;

export const TaskList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 70%;
    margin: 0 auto;
    
`;
