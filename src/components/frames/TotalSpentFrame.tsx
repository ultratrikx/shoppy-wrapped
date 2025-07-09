import { StoryFrameTemplate } from "../StoryFrameTemplate";

interface TotalSpentFrameProps {
    amount: number;
}

const spendingEmojis = [
    {
        emoji: "💰",
        top: "8%",
        left: "6%",
        size: "3.5rem",
        delay: "0s",
    },
    {
        emoji: "💳",
        top: "18%",
        right: "8%",
        size: "2.2rem",
        delay: "0.4s",
    },
    {
        emoji: "🛒",
        bottom: "20%",
        left: "10%",
        size: "2.8rem",
        delay: "0.8s",
    },
    {
        emoji: "💎",
        bottom: "10%",
        right: "7%",
        size: "2.5rem",
        delay: "1.2s",
    },
    {
        emoji: "🤑",
        top: "50%",
        left: "2%",
        size: "2.1rem",
        delay: "1.6s",
    },
    {
        emoji: "💵",
        bottom: "8%",
        right: "20%",
        size: "2.7rem",
        delay: "2s",
    },
];

export const TotalSpentFrame = ({ amount }: TotalSpentFrameProps) => (
    <StoryFrameTemplate
        gradient="bg-gradient-to-br from-green-500 via-green-600 to-green-700"
        emojis={spendingEmojis}
    >
        <h2 className="text-2xl font-light opacity-90">You spent</h2>
        <div className="text-7xl font-bold">${amount.toFixed(0)}</div>
        <p className="text-xl opacity-80">this year on shopping</p>
        {amount > 1000 && (
            <div className="text-lg opacity-70">🎉 Big spender alert!</div>
        )}
    </StoryFrameTemplate>
);
