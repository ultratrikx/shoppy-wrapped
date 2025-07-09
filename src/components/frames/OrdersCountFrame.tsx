import { StoryFrameTemplate } from "../StoryFrameTemplate";

interface OrdersCountFrameProps {
    count: number;
}

const orderEmojis = [
    {
        emoji: "📦",
        top: "10%",
        left: "7%",
        size: "2.7rem",
        delay: "0s",
    },
    {
        emoji: "🛍️",
        top: "20%",
        right: "8%",
        size: "2.3rem",
        delay: "0.5s",
    },
    {
        emoji: "🚚",
        bottom: "18%",
        left: "10%",
        size: "2.5rem",
        delay: "1s",
    },
    {
        emoji: "🎯",
        bottom: "10%",
        right: "12%",
        size: "2.8rem",
        delay: "1.5s",
    },
    {
        emoji: "📬",
        top: "60%",
        right: "5%",
        size: "2.1rem",
        delay: "2s",
    },
    {
        emoji: "🛒",
        bottom: "8%",
        left: "20%",
        size: "2.6rem",
        delay: "2.5s",
    },
];

export const OrdersCountFrame = ({ count }: OrdersCountFrameProps) => (
    <StoryFrameTemplate
        gradient="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700"
        emojis={orderEmojis}
    >
        <h2 className="text-2xl font-light opacity-90">You placed</h2>
        <div className="text-8xl font-bold animate-pulse">{count}</div>
        <p className="text-xl opacity-80">orders</p>
        <div className="text-lg opacity-70">
            {count > 50
                ? "🛍️ Shopping champion!"
                : count > 20
                ? "🎯 Regular shopper"
                : "🌱 Just getting started"}
        </div>
    </StoryFrameTemplate>
);
