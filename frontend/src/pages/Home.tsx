import styled from "styled-components";
//import { Link } from "react-router-dom";
//import { ROUTES } from "../constants/Routes";
import HomeScene from "../components/home/HomeScene";

const DivWrapper = styled.div`
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export default function Home() {
    return (
        <DivWrapper>
            <HomeScene />
        </DivWrapper>
    );
}