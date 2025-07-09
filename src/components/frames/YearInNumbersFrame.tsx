import { StoryFrameTemplate } from "../StoryFrameTemplate";
import { ShoppingStats } from "../../hooks/useShoppingData";

interface YearInNumbersFrameProps {
    stats: ShoppingStats;
}

const numberEmojis = [
    {
        emoji: "📊",
        top: "10%",
        left: "8%",
        size: "3.8rem",
        delay: "0s",
    },
    {
        emoji: "🔢",
        top: "20%",
        right: "10%",
        size: "2.5rem",
        delay: "0.5s",
    },
    {
        emoji: "📈",
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
        emoji: "✨",
        top: "60%",
        right: "5%",
        size: "2.3rem",
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

export const YearInNumbersFrame = ({ stats }: YearInNumbersFrameProps) => (
    <StoryFrameTemplate
        gradient="bg-gradient-to-br from-violet-500 via-violet-600 to-violet-700"
        emojis={numberEmojis}
    >
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold mb-6">Your Year in Numbers</h2>
        <div className="space-y-4">
            <div className="text-lg">
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <div className="opacity-80">Products purchased</div>
            </div>
            <div className="text-lg">
                <div className="text-2xl font-bold">{stats.uniqueShops}</div>
                <div className="opacity-80">Unique shops visited</div>
            </div>
            <div className="text-lg">
                <div className="text-2xl font-bold">
                    ${stats.avgOrderValue.toFixed(0)}
                </div>
                <div className="opacity-80">Average order value</div>
            </div>
            <div className="text-lg">
                <div className="text-2xl font-bold">
                    {stats.savedProductsCount}
                </div>
                <div className="opacity-80">Items saved for later</div>
            </div>
        </div>
    </StoryFrameTemplate>
);
