import LottieLoading from "./LottieLoading";
import styled from "styled-components";

const Overlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(255,255,255,0.6);
    backdrop-filter: blur(6px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
`;

export default function GlobalLoading({ loading }: { loading: boolean }) {
    if (!loading) return null;

    return (
        <Overlay>
            <LottieLoading size={140} />
        </Overlay>
    );
}