import styled from "styled-components";
import type { Task } from "../../types/Task";
import type { ScheduleBlock } from "../../types/ScheduleBlock";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);

  display: flex;
  align-items: center;
  justify-content: center;
`;

const CenteredBox = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  min-width: 300px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
`;

const Button = styled.button`
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
`;

type Props = {
    item: Task | ScheduleBlock | null;
    onClose: () => void;
    onStart: (item: Task | ScheduleBlock) => void;
    onAutomate: (item: Task | ScheduleBlock) => void;
};

export default function TaskActionModal({item, onClose, onStart, onAutomate,}: Props) {
    if (!item) return null;

    // simple title fallback
    const title = "title" in item ? item.title : "Task";

    return (
        <Overlay onClick={onClose}>
            <CenteredBox onClick={(e) => e.stopPropagation()}>
                <div>What do you want to do?</div>
                <div style={{ opacity: 0.7, marginTop: 4 }}>{title}</div>

                <ButtonRow>
                    <Button onClick={() => onStart(item)}>Start</Button>
                    <Button onClick={() => onAutomate(item)}>Automate</Button>
                    <Button onClick={onClose}>Cancel</Button>
                </ButtonRow>
            </CenteredBox>
        </Overlay>
    );
}