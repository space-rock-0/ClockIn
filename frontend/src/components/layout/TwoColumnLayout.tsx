import React from "react";
import styled from "styled-components";

const Container = styled.div`
    display: flex;
    height: 100%;
    position: relative;
`;

const Left = styled.div`
    flex: 3;
    border-right: 1px solid lightgray;
`;

const Right = styled.div`
    flex: 7;
`;

export default function TwoColumnLayout(
    {left, right}: {left: React.ReactNode; right: React.ReactNode})
{
    return (
        <Container>
            <Left>{left}</Left>
            <Right>{right}</Right>
        </Container>
    );
}