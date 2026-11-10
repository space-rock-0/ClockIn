import styled, { keyframes } from "styled-components";
import {useEffect} from "react";

const fadeIn = keyframes`
    from { opacity: 0; transform: scale(0.94); }
    to   { opacity: 1; transform: scale(1); }
`;

const Backdrop = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const Modal = styled.div`
    background: #1e2535;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 16px;
    padding: 28px 32px;
    min-width: 320px;
    animation: ${fadeIn} 0.18s ease;
    box-shadow: 0 24px 60px rgba(0,0,0,0.5);
`;

const Title = styled.h3`
    margin: 0 0 8px;
    font-size: 1.1rem;
    font-weight: 600;
    color: #f1f5f9;
`;

const Message = styled.p`
    margin: 0 0 24px;
    font-size: 0.88rem;
    color: rgba(255,255,255,0.5);
    line-height: 1.5;
`;

const Buttons = styled.div`
    display: flex;
    gap: 10px;
    justify-content: flex-end;
`;

const CancelBtn = styled.button`
    padding: 8px 18px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.15);
    background: transparent;
    color: rgba(255,255,255,0.7);
    font-size: 0.88rem;
    cursor: pointer;
    transition: background 0.15s;
    &:hover { background: rgba(255,255,255,0.08); }
`;

const ConfirmBtn = styled.button`
    padding: 8px 18px;
    border-radius: 8px;
    border: none;
    background: #ef4444;
    color: white;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    &:hover { background: #dc2626; }
`;

type Props = {
    noteTitle: string;
    onConfirm: () => void;
    onCancel: () => void;
};

export default function DeleteConfirmModal({ noteTitle, onConfirm, onCancel }: Props) {

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
            if (e.key === "Enter") onConfirm();
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onCancel, onConfirm]);

    return (
        <Backdrop onClick={onCancel}>
            <Modal onClick={(e) => e.stopPropagation()}>
                <Title>{noteTitle}</Title>
                <Message>This cannot be undone.</Message>
                <Buttons>
                    <CancelBtn onClick={onCancel}>Cancel</CancelBtn>
                    <ConfirmBtn onClick={onConfirm}>Confirm</ConfirmBtn>
                </Buttons>
            </Modal>
        </Backdrop>
    );
}