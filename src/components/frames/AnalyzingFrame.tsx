import { StoryFrameTemplate } from "../StoryFrameTemplate";

interface AnalyzingFrameProps {
    progress: number;
}

const analyzingEmojis = [
    {
        emoji: "🔎",
        top: "10%",
        left: "8%",
        size: "4rem",
        delay: "0s",
    },
    {
        emoji: "🧠",
        top: "20%",
        right: "10%",
        size: "2.7rem",
        delay: "0.5s",
    },
    {
        emoji: "📊",
        bottom: "18%",
        left: "12%",
        size: "3.2rem",
        delay: "1s",
    },
    {
        emoji: "✨",
        bottom: "12%",
        right: "10%",
        size: "2.5rem",
        delay: "1.5s",
    },
    {
        emoji: "⏳",
        top: "60%",
        right: "5%",
        size: "2.9rem",
        delay: "2s",
    },
    {
        emoji: "🤖",
        bottom: "8%",
        left: "20%",
        size: "3.5rem",
        delay: "2.5s",
    },
];

export const AnalyzingFrame = ({ progress }: AnalyzingFrameProps) => (
    <StoryFrameTemplate
        gradient="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800"
        emojis={analyzingEmojis}
    >
        <div className="relative">
            <div className="w-24 h-24 border-4 border-white/30 rounded-full animate-spin">
                <div className="w-full h-full border-4 border-white border-b-transparent rounded-full"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-2xl">
                {progress}%
            </div>
        </div>
        <h2 className="text-3xl font-bold">
            Analyzing your
            <br />
            shopping journey...
        </h2>
        <p className="text-lg opacity-80">Crunching the numbers ✨</p>
    </StoryFrameTemplate>
);
