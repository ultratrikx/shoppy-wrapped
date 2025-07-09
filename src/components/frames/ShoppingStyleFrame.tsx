import { StoryFrameTemplate } from "../StoryFrameTemplate";
import { ShoppingStats } from "../../hooks/useShoppingData";

interface ShoppingStyleFrameProps {
    stats: ShoppingStats;
}

const styleEmojis = [
    {
        emoji: "🎨",
        top: "10%",
        left: "8%",
        size: "4.2rem",
        delay: "0s",
    },
    {
        emoji: "🧥",
        top: "20%",
        right: "10%",
        size: "2.8rem",
        delay: "0.5s",
    },
    {
        emoji: "👖",
        bottom: "18%",
        left: "12%",
        size: "3.5rem",
        delay: "1s",
    },
    {
        emoji: "👟",
        bottom: "12%",
        right: "10%",
        size: "2.3rem",
        delay: "1.5s",
    },
    {
        emoji: "🕶️",
        top: "60%",
        right: "5%",
        size: "2.7rem",
        delay: "2s",
    },
    {
        emoji: "🧢",
        bottom: "8%",
        left: "20%",
        size: "3.1rem",
        delay: "2.5s",
    },
];

export const ShoppingStyleFrame = ({ stats }: ShoppingStyleFrameProps) => {
    const getShoppingStyle = () => {
        if (stats.totalSpent > 5000) return "Luxury Lover";
        if (stats.totalOrders > 50) return "Shopping Enthusiast";
        if (stats.moneySaved && stats.moneySaved > 500) return "Savvy Saver";
        if (stats.shoppingStreak > 6) return "Consistent Collector";
        return "Casual Shopper";
    };

    return (
        <StoryFrameTemplate
            gradient="bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700"
            emojis={styleEmojis}
        >
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-light opacity-90">
                Your shopping style
            </h2>
            <div className="text-3xl font-bold">{getShoppingStyle()}</div>
            <p className="text-lg opacity-80">
                Based on your shopping patterns
            </p>
            <div className="mt-4 space-y-2 text-sm opacity-70">
                <div>{stats.totalOrders} orders placed</div>
                <div>${stats.totalSpent.toFixed(0)} spent</div>
                <div>{stats.shoppingStreak} month shopping streak</div>
            </div>
        </StoryFrameTemplate>
    );
};
