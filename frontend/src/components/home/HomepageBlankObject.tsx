import styled from "styled-components"
import HomepageBlankIcon from "../icons/HomepageBlankIcon"
import NightHomepageIcon from "../icons/NightHomepageIcon"
import { useTheme } from "../../context/ThemeContext"

const StyledDay = styled(HomepageBlankIcon)`
    width: 100%;
    height: 100%;
`;

const StyledNight = styled(NightHomepageIcon)`
    width: 100%;
    height: 100%;
`;

export default function HomepageBlankObject() {
    const { isDark } = useTheme();
    return isDark ? <StyledNight /> : <StyledDay />;
}
