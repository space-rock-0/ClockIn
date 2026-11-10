import styled from "styled-components";
import type { StickyNoteTheme } from "../../types/StickyNoteThemes";

const BackgroundWrapper = styled.div`
    position: absolute;
    inset: 0;
`;

const BaseNote = styled.svg`
    width: 100%;
    height: 100%;
`;

const Fold = styled.svg`
    position: absolute;
    bottom: 0;
    right: 0;
    width: 30%;
`;

type StickyNoteBackgroundProps = {
    theme: StickyNoteTheme
}

export default function StickyNoteBackground({ theme }: StickyNoteBackgroundProps) {
    return (
        <BackgroundWrapper>

            {/* base note */}
            <BaseNote viewBox="0 0 292 292">
                <path
                    d="M0 24C0 10.7452 10.7452 0 24 0H267.6C280.855 0 291.6 10.7452 291.6 24V236.877L201.527 291.455C201.371 291.55 201.192 291.6 201.009 291.6H24C10.7452 291.6 0 280.855 0 267.6V24Z"
                    fill={theme.background}
                />
            </BaseNote>

            {/* folded corner */}
            <Fold viewBox="0 0 91 69">
                <path
                    d="M90.3118 13.8837C90.3118 13.8837 51.5339 -10.4137 44.0079 5.27763C36.4819 20.969 33.1654 25.7827 25.6394 38.1886C16.003 54.0734 0 68.8035 0 68.8035L90.3118 13.8837Z"
                    fill={theme.fold}
                />
            </Fold>

        </BackgroundWrapper>
    );
}