import Lottie from "lottie-react";
import styled, { keyframes } from "styled-components";
import animationData from "../../assets/animations/loading.json";

const bob = keyframes`
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-20px); }
`;

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const BeeWrapper = styled.div`
    animation: ${bob} 1.2s ease-in-out infinite;
`;

export default function LottieLoading({ size = 120 }: { size?: number }) {
    return (
        <Wrapper>
            <BeeWrapper>
                <div style={{ width: size, height: size }}>
                    <Lottie animationData={animationData} loop autoplay />
                </div>
            </BeeWrapper>
        </Wrapper>
    );
}
