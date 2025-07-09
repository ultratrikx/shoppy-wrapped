import { StoryFrameTemplate } from "../StoryFrameTemplate";

interface WelcomeFrameProps {
    onStart: () => void;
}

const welcomeEmojis = [
    {
        emoji: "🛍️",
        top: "8%",
        left: "6%",
        size: "4.5rem",
        delay: "0s",
    },
    {
        emoji: "✨",
        top: "18%",
        right: "8%",
        size: "2.5rem",
        delay: "0.4s",
    },
    {
        emoji: "🎉",
        bottom: "20%",
        left: "10%",
        size: "3.8rem",
        delay: "0.8s",
    },
    {
        emoji: "💙",
        bottom: "10%",
        right: "7%",
        size: "2.2rem",
        delay: "1.2s",
    },
    {
        emoji: "🛒",
        top: "50%",
        left: "2%",
        size: "2.7rem",
        delay: "1.6s",
    },
    {
        emoji: "👟",
        bottom: "8%",
        right: "20%",
        size: "3.2rem",
        delay: "2s",
    },
];

export const WelcomeFrame = ({ onStart }: WelcomeFrameProps) => (
    <StoryFrameTemplate
        gradient="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800"
        emojis={welcomeEmojis}
    >
        <div className="text-6xl mb-4">🛍️</div>
        <h1 className="text-4xl font-bold">
            Shopping
            <br />
            Wrapped
        </h1>
        <p className="text-lg opacity-80">
            Your year in shopping,
            <br />
            beautifully visualized
        </p>
        <button
            onClick={onStart}
            className="mt-12 px-8 py-4 bg-white text-blue-700 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors"
        >
            Let's dive in
        </button>
        <div className="absolute bottom-8 text-sm opacity-60">
            Tap to navigate →
        </div>
    </StoryFrameTemplate>
);
