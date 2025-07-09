import { StoryFrameTemplate } from "../StoryFrameTemplate";
import { ShoppingStats } from "../../hooks/useShoppingData";

interface PersonalityFrameProps {
    stats: ShoppingStats;
    personaError: string | null;
}

const personalityEmojis = [
    {
        emoji: "🎭",
        top: "10%",
        left: "8%",
        size: "4rem",
        delay: "0s",
    },
    {
        emoji: "✨",
        top: "20%",
        right: "10%",
        size: "2.5rem",
        delay: "0.5s",
    },
    {
        emoji: "🌟",
        bottom: "18%",
        left: "12%",
        size: "3.2rem",
        delay: "1s",
    },
    {
        emoji: "💫",
        bottom: "12%",
        right: "10%",
        size: "2.7rem",
        delay: "1.5s",
    },
    {
        emoji: "🎪",
        top: "60%",
        right: "5%",
        size: "3rem",
        delay: "2s",
    },
    {
        emoji: "🎯",
        bottom: "8%",
        left: "20%",
        size: "2.8rem",
        delay: "2.5s",
    },
];

export const PersonalityFrame = ({
    stats,
    personaError,
}: PersonalityFrameProps) => (
    <StoryFrameTemplate
        gradient="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700"
        emojis={personalityEmojis}
    >
        <div className="text-6xl mb-4">🎭</div>
        <h2 className="text-2xl font-bold">Your Shopping Persona</h2>
        {personaError ? (
            <div className="text-red-200">
                <p>Oops! We couldn't analyze your shopping persona.</p>
                <p className="text-sm mt-2 opacity-80">
                    But we know you're awesome! 🌟
                </p>
            </div>
        ) : (
            <>
                <div className="text-3xl font-bold mt-4">{stats.persona}</div>
                <p className="text-lg opacity-80 mt-4 max-w-xs mx-auto">
                    {stats.personaDescription}
                </p>
            </>
        )}
    </StoryFrameTemplate>
);
