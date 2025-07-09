import { StoryFrameTemplate } from "../StoryFrameTemplate";

interface FavoriteShopFrameProps {
    shop?: string;
}

const shopEmojis = [
    {
        emoji: "🏪",
        top: "10%",
        left: "8%",
        size: "4.2rem",
        delay: "0s",
    },
    {
        emoji: "🛍️",
        top: "20%",
        right: "10%",
        size: "2.8rem",
        delay: "0.5s",
    },
    {
        emoji: "💖",
        bottom: "18%",
        left: "12%",
        size: "3.5rem",
        delay: "1s",
    },
    {
        emoji: "🧁",
        bottom: "12%",
        right: "10%",
        size: "2.3rem",
        delay: "1.5s",
    },
    {
        emoji: "🎀",
        top: "60%",
        right: "5%",
        size: "2.7rem",
        delay: "2s",
    },
    {
        emoji: "🛒",
        bottom: "8%",
        left: "20%",
        size: "3.1rem",
        delay: "2.5s",
    },
];

export const FavoriteShopFrame = ({ shop }: FavoriteShopFrameProps) => (
    <StoryFrameTemplate
        gradient="bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700"
        emojis={shopEmojis}
    >
        <div className="text-6xl mb-4">🏪</div>
        <h2 className="text-2xl font-light opacity-90">Your favorite shop</h2>
        <div className="text-3xl font-bold max-w-xs">
            {shop || "No favorite shop yet"}
        </div>
        <p className="text-lg opacity-80">Where you love to shop most</p>
    </StoryFrameTemplate>
);
