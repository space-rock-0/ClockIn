import styled, { keyframes } from "styled-components";
import FreeModeIcon from "../icons/FreeModeIcon.tsx";
import TaskModeIcon from "../icons/TaskModeIcon.tsx";
import HomepageBlankIcon from "../icons/HomepageBlankIcon.tsx";
import NightHomepageIcon from "../icons/NightHomepageIcon.tsx";
import { useTheme } from "../../context/ThemeContext";

const fadeIn = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;

const slideUp = keyframes`
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const PageWrapper = styled.div`
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    animation: ${fadeIn} 0.2s ease;
`;

const bgStyles = `
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    filter: blur(6px);
    transform: scale(1.05);
`;

const DayBgSVG = styled(HomepageBlankIcon)`${bgStyles}`;
const NightBgSVG = styled(NightHomepageIcon)`${bgStyles}`;

const BackgroundOverlay = styled.div`
    position: fixed;
    inset: 0;
    z-index: 1;
    background: rgba(28, 77, 119, 0.5);

    [data-theme="dark"] & {
        background: rgba(20, 15, 45, 0.5);
    }
`;

const Content = styled.div`
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    animation: ${slideUp} 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
`;

const TopSection = styled.div`
    padding-top: 4rem;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const CenterSection = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const Title = styled.h1`
    font-size: 3rem;
    font-weight: 700;
    color: white;
    font-style: italic;
    text-align: center;
    margin: 0 0 0.4rem;
    letter-spacing: 0.01em;
    text-shadow: 0 2px 12px rgba(0,0,0,0.15);
`;

const Subtitle = styled.p`
    font-size: 1.3rem;
    font-weight: 700;
    color: white;
    text-align: center;
    margin: 0;
`;

const ButtonRow = styled.div`
    display: flex;
    gap: 1.8rem;
    justify-content: center;
    flex-wrap: wrap;
`;

const SubRow = styled.div`
    display: flex;
    gap: 3rem;
    justify-content: center;
    margin-top: 0.9rem;
`;

const ModeButton = styled.button<{ $yellow?: boolean }>`
    cursor: pointer;
    background: ${({ $yellow }) => $yellow ? "#FFF59A" : "#AFDBFF"};
    border: 2.4px solid ${({ $yellow }) => $yellow ? "#FFF59A" : "#AFDBFF"};
    border-radius: 999px;
    padding: 0.78rem 1.92rem;
    display: flex;
    align-items: center;
    gap: 1.3rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    backdrop-filter: blur(6px);

    &:hover {
        transform: scale(1.08);
        box-shadow: 0 0 20px rgba(255,255,255,0.35);
    }
    &:hover span { font-size: 1.26rem; }
    &:hover div { transform: scale(1.15); }
`;

const ButtonLabel = styled.span`
    color: #4B94DB;
    font-size: 1.8rem;
    font-weight: 700;
    transition: font-size 0.2s ease;
    white-space: nowrap;
`;

const IconWrapper = styled.div`
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.2s ease;
`;

const SubText = styled.p`
    font-size: 1.3rem;
    font-weight: 700;
    color: white;
    width: 204px;
    text-align: center;
    margin: 0;
    line-height: 1.4;
`;

type Props = {
    onFree: () => void;
    onTask: () => void;
};

export default function TaskOpenModal({ onFree, onTask }: Props) {
    const { isDark } = useTheme();
    return (
        <PageWrapper>
            {isDark ? <NightBgSVG /> : <DayBgSVG />}
            <BackgroundOverlay />
            <Content>
                <TopSection>
                    <div data-tutorial-id="timer-start">
                        <Title>Your Timer</Title>
                        <Subtitle>What kind of work will you do?</Subtitle>
                    </div>
                </TopSection>

                <CenterSection>
                    <ButtonRow>
                        <div data-tutorial-id="free-timer">
                            <ModeButton onClick={onFree}>
                                <IconWrapper>
                                    <FreeModeIcon/>
                                </IconWrapper>
                                <ButtonLabel>Free Timer</ButtonLabel>
                            </ModeButton>
                        </div>

                        <div data-tutorial-id="task-timer">
                            <ModeButton $yellow onClick={onTask}>
                                <IconWrapper>
                                    <TaskModeIcon/>
                                </IconWrapper>
                                <ButtonLabel>Task Timer</ButtonLabel>
                            </ModeButton>
                        </div>
                    </ButtonRow>

                    <SubRow>
                        <SubText>Set a timer and study as you like to!</SubText>
                        <SubText>Pick a task and get it done!</SubText>
                    </SubRow>
                </CenterSection>
            </Content>
        </PageWrapper>
    );
}