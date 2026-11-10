import { useState } from "react";
import styled, { keyframes } from "styled-components";
import LottieLoading from "../ui/LottieLoading";
import type { Task } from "../../types/Task";
import { generateTasksFromFile } from "../../api/taskApi"; // adjust path

type Props = {
    onClose: () => void;
    onTasksGenerated: (tasks: Task[]) => void;
};

// ─── Component ───────────────────────────────────────────

export default function FileUploadModal({
                                            onClose,
                                            onTasksGenerated,
                                        }: Props) {

    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const hasFile = file !== null;

    async function handleGenerate() {
        if (!file) return;

        setIsLoading(true);

        try {
            const tasks = await generateTasksFromFile(file);
            onTasksGenerated(tasks); // 🔥 pass to parent
        } catch (err) {
            console.error(err);
            alert("Failed to generate tasks");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <UploadBackdrop onClick={(e) => e.stopPropagation()}>
            <UploadCard onClick={(e) => e.stopPropagation()}>

                <Title>Upload File</Title>
                <Subtitle>
                    Turn Assignment PDFs into detailed tasks!
                </Subtitle>

                <label style={{
                    padding: "10px 14px",
                    border: "1.5px dashed #ccc",
                    borderRadius: "10px",
                    textAlign: "center",
                    cursor: "pointer"
                }}>
                    {file ? file.name : "Click to upload PDF"}
                    <input
                        type="file"
                        accept=".pdf"
                        style={{ display: "none" }}
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                </label>

                {file && <div>{file.name}</div>}

                {/* LOADING */}
                {isLoading && <LottieLoading size={120} />}

                {/* ACTIONS */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>

                    <ActionButton
                        $variant="blue"
                        onClick={() => {
                            setFile(null);
                            onClose();
                        }}
                    >
                        Cancel
                    </ActionButton>

                    <ActionButton
                        $variant={hasFile ? "yellow" : "gray"}
                        disabled={!hasFile || isLoading}
                        onClick={handleGenerate}
                    >
                        {isLoading ? "Loading..." : "Create Tasks From File"}
                    </ActionButton>

                </div>

            </UploadCard>
        </UploadBackdrop>
    );
}

// ─── Animation ───────────────────────────────────────────

const slideUp = keyframes`
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;

// ─── Styled Components ───────────────────────────────────

const UploadBackdrop = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
`;

const UploadCard = styled.div`
    background: white;
    border-radius: 16px;
    padding: 28px 32px;
    width: 480px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    animation: ${slideUp} 0.25s ease;
`;

const Title = styled.h2`
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
`;

const Subtitle = styled.p`
    margin: 0;
    color: #777;
    font-size: 0.9rem;
`;

const ActionButton = styled.button<{ $variant?: "blue" | "yellow" | "gray" }>`
    border: none;
    border-radius: 999px;
    padding: 10px 20px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s ease;

    background: ${({ $variant }) => {
        if ($variant === "yellow") return "#FFF59A";
        if ($variant === "blue") return "#AFDBFF";
        return "#e5e5e5";
    }};

    color: ${({ $variant }) =>
            $variant === "gray" ? "#999" : "#4B94DB"};

    &:hover {
        transform: ${({ disabled }) => disabled ? "none" : "translateY(-2px) scale(1.05)"};
        box-shadow: ${({ disabled }) => disabled ? "none" : "0 6px 16px rgba(0,0,0,0.15)"};
    }

    &:active {
        transform: ${({ disabled }) => disabled ? "none" : "translateY(0px)"};
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
`;

