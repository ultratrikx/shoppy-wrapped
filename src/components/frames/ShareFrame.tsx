import { StoryFrameTemplate } from "../StoryFrameTemplate";
import { ShoppingStats } from "../../hooks/useShoppingData";

interface ShareFrameProps {
    stats: ShoppingStats;
    onShare: () => void;
    onInstagramShare: () => void;
    isCapturing: boolean;
    personaError: string | null;
}

const shareEmojis = [
    {
        emoji: "📱",
        top: "10%",
        left: "8%",
        size: "3.5rem",
        delay: "0s",
    },
    {
        emoji: "✨",
        top: "20%",
        right: "10%",
        size: "2.8rem",
        delay: "0.5s",
    },
    {
        emoji: "📸",
        bottom: "18%",
        left: "12%",
        size: "3rem",
        delay: "1s",
    },
    {
        emoji: "💫",
        bottom: "12%",
        right: "10%",
        size: "2.5rem",
        delay: "1.5s",
    },
    {
        emoji: "🌟",
        top: "60%",
        right: "5%",
        size: "2.7rem",
        delay: "2s",
    },
    {
        emoji: "🎉",
        bottom: "8%",
        left: "20%",
        size: "3.2rem",
        delay: "2.5s",
    },
];

export const ShareFrame = ({
    stats,
    onShare,
    onInstagramShare,
    isCapturing,
    personaError,
}: ShareFrameProps) => (
    <StoryFrameTemplate
        gradient="bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700"
        emojis={!isCapturing ? shareEmojis : []}
    >
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold mb-6">
            That's a wrap on your
            <br />
            Shopping Journey!
        </h2>
        <div className="space-y-3 text-lg opacity-90">
            <div>💰 Spent: ${stats.totalSpent.toFixed(0)}</div>
            <div>🛍️ Orders: {stats.totalOrders}</div>
            <div>💝 Favorite Shop: {stats.favoriteShop}</div>
            {stats.persona && !personaError && (
                <div>🎭 Shopping Persona: {stats.persona}</div>
            )}
        </div>
        {!isCapturing && (
            <div className="mt-8 space-y-4">
                <button
                    onClick={onInstagramShare}
                    className="w-full px-6 py-3 bg-white text-pink-600 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                    Share to Instagram Story
                </button>
                <button
                    onClick={onShare}
                    className="w-full px-6 py-3 bg-pink-700 text-white rounded-full font-semibold hover:bg-pink-800 transition-colors"
                >
                    Share Link
                </button>
            </div>
        )}
    </StoryFrameTemplate>
);
