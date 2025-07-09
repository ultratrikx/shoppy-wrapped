import { StoryFrameTemplate } from "../StoryFrameTemplate";

interface AllItemsFrameProps {
    items: Array<{
        id: string;
        title: string;
        quantity: number;
    }>;
}

const itemEmojis = [
    {
        emoji: "🛍️",
        top: "10%",
        left: "8%",
        size: "3.5rem",
        delay: "0s",
    },
    {
        emoji: "📦",
        top: "20%",
        right: "10%",
        size: "2.8rem",
        delay: "0.5s",
    },
    {
        emoji: "🎁",
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
        emoji: "🛒",
        top: "60%",
        right: "5%",
        size: "2.7rem",
        delay: "2s",
    },
    {
        emoji: "🎯",
        bottom: "8%",
        left: "20%",
        size: "3rem",
        delay: "2.5s",
    },
];

export const AllItemsFrame = ({ items }: AllItemsFrameProps) => {
    // Sort items by quantity, highest first
    const sortedItems = [...items].sort((a, b) => b.quantity - a.quantity);

    // Take top 5 items
    const topItems = sortedItems.slice(0, 5);

    return (
        <StoryFrameTemplate
            gradient="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700"
            emojis={itemEmojis}
        >
            <div className="text-6xl mb-4">🛍️</div>
            <h2 className="text-2xl font-bold mb-6">Your Shopping Cart</h2>
            <div className="space-y-4 max-h-80 overflow-y-auto">
                {topItems.map((item, index) => (
                    <div
                        key={item.id || index}
                        className="text-left p-3 bg-white/10 rounded-lg"
                    >
                        <div className="font-semibold truncate">
                            {item.title}
                        </div>
                        <div className="text-sm opacity-80">
                            Purchased {item.quantity}{" "}
                            {item.quantity === 1 ? "time" : "times"}
                        </div>
                    </div>
                ))}
            </div>
            {items.length > 5 && (
                <div className="mt-4 text-sm opacity-70">
                    And {items.length - 5} more items...
                </div>
            )}
        </StoryFrameTemplate>
    );
};
