import { useEffect, useState } from "react";
import digital7 from "../../assets/fonts/digital-7.ttf";

export default function ClockIcon( {className} : {className?: string}) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const updateTime = () => setNow(new Date());
        const interval = window.setInterval(updateTime, 1000);
        document.addEventListener("visibilitychange", updateTime);
        return () => {
            window.clearInterval(interval);
            document.removeEventListener("visibilitychange", updateTime);
        };
    }, []);

    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return (
        <svg className={className} role="img" aria-label={`Local time ${time}`}
            width="290" height="152" viewBox="0 0 290 152" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path opacity="0.5" d="M26.8017 117.194C21.372 115.988 21.6742 108.149 27.1807 107.364L198.857 82.889C199.251 82.8328 199.651 82.8239 200.047 82.8625L289 91.5283L81.9922 129.059C81.3373 129.177 80.6653 129.164 80.0156 129.02L26.8017 117.194Z" fill="#D9D9D9"/>
            <path d="M220.957 0.555656L269.086 5.06814L126.756 33.5505L115.085 117.713L68 112.383V33.0941C68 22.2672 76.2314 13.2149 87.0096 12.1887L209.105 0.564174C213.046 0.188894 217.015 0.186042 220.957 0.555656Z" fill="#0E4F87"/>
            <path d="M115.085 36.4343C115.085 27.1704 122.116 19.4194 131.336 18.5194L269.463 5.03702C280.044 4.00413 289.211 12.3197 289.211 22.9519V91.9758L115.085 117.713V36.4343Z" fill="#AFDBFF"/>
            <path d="M115.085 36.4099C115.085 27.1564 122.101 19.4105 131.309 18.4977L267.033 5.04348C270.574 4.69247 274.14 5.39883 277.28 7.07333L280.911 9.01014L143.717 23.4918C131.245 24.8083 121.49 34.8404 120.524 47.3444L115.085 117.713V36.4099Z" fill="#4B94DB"/>
            <path className="digit" d="M277.448 53.2776L278.928 54.613L277.322 77.2382C276.637 79.4866 275.212 81.0672 273.046 81.9801L271.111 75.9368L272.316 58.9679L277.448 53.2776ZM273.12 47.6552L274.324 30.6863L277.177 23.8009C279.266 23.9654 280.5 25.0782 280.879 27.1395L279.273 49.7647L277.562 51.6615L273.12 47.6552Z" fill="#0E4F87"/>
            <path className="digit" d="M233.096 57.0889L236.057 59.7598L232.637 63.5533L211.893 67.202L208.931 64.5312L212.352 60.7377L233.096 57.0889ZM237.596 60.2871L239.077 61.6225L237.47 84.2478C236.785 86.4961 235.36 88.0768 233.194 88.9897L231.26 82.9464L232.465 65.9774L237.596 60.2871ZM213.786 40.5365L212.524 58.3135L207.393 64.0038L205.912 62.6684L207.576 39.2351L213.786 40.5365ZM233.268 54.6648L234.473 37.6959L237.325 30.8105C239.414 30.975 240.649 32.0878 241.027 34.149L239.421 56.7743L237.711 58.671L233.268 54.6648Z" fill="#0E4F87"/>
            <path className="digit" d="M184.684 84.7557L178.301 85.8784L178.76 79.4141L185.143 78.2914L184.684 84.7557ZM186.52 58.8983L180.137 60.021L180.596 53.5566L186.979 52.4339L186.52 58.8983Z" fill="#0E4F87"/>
            <path className="digit" d="M157.89 74.3072L159.371 75.6426L157.765 98.2678C157.08 100.516 155.654 102.097 153.489 103.01L151.554 96.9664L152.759 79.9974L157.89 74.3072ZM153.171 51.9965L134.103 55.3506L127.893 54.0491C128.578 51.8008 130.003 50.2202 132.169 49.3072L156.024 45.1112L153.171 51.9965ZM133.909 56.9807L132.819 72.3336L127.687 78.0238L126.206 76.6884L127.698 55.6793L133.909 56.9807ZM153.562 68.6848L154.767 51.7159L157.62 44.8305C159.709 44.995 160.943 46.1078 161.322 48.169L159.715 70.7943L158.005 72.6911L153.562 68.6848Z" fill="#0E4F87"/>
            <style>{`@font-face { font-family: 'ClockInClockDigits'; src: url('${digital7}') format('truetype'); font-display: swap; }`}</style>
            <text className="digit" transform="matrix(1 -0.15 -0.07 1 131 48)"
                x="0" y="53" fill="#0E4F87" fontFamily="ClockInClockDigits, monospace"
                fontSize="64" textLength="145" lengthAdjust="spacingAndGlyphs">{time}</text>
        </svg>


    )
}
