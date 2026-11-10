import StickyNoteFrame from "./StickyNoteFrame";
import type {Note} from "../../types/Note";
import styled from "styled-components";
import { StickyNoteThemes } from "../../types/StickyNoteThemes";

const Title = styled.h3`
    font-size: 1.35rem;
    font-weight: 600;

    margin: 0 0 0.4rem;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const Content = styled.p`
    font-size: 0.95rem;
    line-height: 1.5;

    margin: 0;

    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;

    word-break: break-word;
`;

type Props = {
    note: Note;
    onClick?: () => void;
};

export default function StickyNoteViewOnly({note, onClick}: Props) {
    return (
        // children passed auto by title, content
        <StickyNoteFrame
            onClick={onClick}
            theme={StickyNoteThemes[note.color]}>
            <Title>{note.title}</Title>
            <Content dangerouslySetInnerHTML={{ __html: note.content }} />
        </StickyNoteFrame>
    );
}