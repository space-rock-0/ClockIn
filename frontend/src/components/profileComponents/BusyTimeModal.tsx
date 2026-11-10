import styled from "styled-components";
import BusyTimeCard, { type BusyTimeData } from "./BusyTimeCard.tsx";

const Overlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
`;

const Modal = styled.div`
    background: white;
    border-radius: 12px;
    width: min(480px, 92vw);
`;

type Props = {
    initial?: Partial<BusyTimeData>;
    existingTimes?: BusyTimeData[];
    onSave: (data: BusyTimeData) => void;
    onClose: () => void;
    onDuplicate?: () => void;
}

export default function BusyTimeModal({ initial, existingTimes, onSave, onClose, onDuplicate }: Props) {
    return (
        <Overlay onClick={onClose}>
            <Modal onClick={e => e.stopPropagation()}>
                <BusyTimeCard
                    initial={initial}
                    existingTimes={existingTimes}
                    onSave={onSave}
                    onCancel={onClose}
                    onDuplicate={onDuplicate}
                />
            </Modal>
        </Overlay>
    );
}