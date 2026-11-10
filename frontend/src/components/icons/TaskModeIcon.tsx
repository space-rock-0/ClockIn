export default function TaskModeIcon({className} : {className?: string}) {
    return (
        <svg className={className}
             width="105" height="101" viewBox="0 0 105 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="105" height="100.556" rx="5" fill="#AFDBFF"/>
            <path
                d="M100 0.00195312C102.761 0.00195312 105 2.24057 105 5.00195V20.8486H0V5.00195C4.31473e-05 2.24057 2.2386 0.00195318 5 0.00195312H100Z"
                fill="#4B94DB"/>
            <path d="M17.2866 38.6289H86.433" stroke="#4B94DB" stroke-width="10" stroke-linecap="round"/>
            <path d="M17.2026 58.8213H86.349" stroke="#4B94DB" stroke-width="10" stroke-linecap="round"/>
            <path d="M17.2026 81.8857H36.41" stroke="#4B94DB" stroke-width="10" stroke-linecap="round"/>
            <path d="M68.4224 81.8857H86.3492" stroke="#4B94DB" stroke-width="10" stroke-linecap="round"/>
        </svg>
    );
}
