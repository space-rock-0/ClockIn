import styled from "styled-components";

const Card = styled.div`
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding: 16px 20px;
    border-radius: 14px;
    background: white;
    border: 1.5px solid #e0e0e0;
    box-shadow: -2px 2px 8px #d8d8d8;
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const Left = styled.div`
    display: flex;
    align-items: center;
    gap: 24px;
    flex: 1;
`;

const Title = styled.div`
    font-weight: 700;
    font-size: 0.95rem;
    color: #222;
    min-width: 120px;
`;

const Time = styled.div`
    color: #555;
    font-size: 0.9rem;
    min-width: 200px;
`;

const Days = styled.div`
    color: #888;
    font-size: 0.85rem;
`;

const Actions = styled.div`
    display: flex;
    gap: 16px;
`;

const ActionBtn = styled.button`
    border: none;
    background: none;
    cursor: pointer;
    font-size: 0.85rem;
    color: #888;
    font-weight: 600;

    &:hover { color: #222; }
`;

type Props = {
    title: string;
    time: string;
    days: string;
    source?: string;
    onEdit: () => void;
    onDelete: () => void;
};

export default function BusyTimeItem({ title, time, days, source, onEdit, onDelete }: Props) {
    const isGoogle = source === "google";
    return (
        <Card>
            <Left>
                <Title>{title}</Title>
                <Time>{time}</Time>
                <Days>{days}</Days>
            </Left>
            {!isGoogle && (
                <Actions>
                    <ActionBtn onClick={onEdit}>Edit</ActionBtn>
                    <ActionBtn onClick={onDelete}>Delete</ActionBtn>
                </Actions>
            )}
        </Card>
    );
}