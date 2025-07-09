import { StoryFrameTemplate } from "../StoryFrameTemplate";

interface MoneySavedFrameProps {
    amount: number;
}

const moneySavedEmojis = [
    {
        emoji: "🐷",
        top: "12%",
        left: "8%",
        size: "3.2rem",
        delay: "0s",
    },
    {
        emoji: "🪙",
        top: "22%",
        right: "10%",
        size: "2.5rem",
        delay: "0.5s",
    },
    {
        emoji: "💸",
        bottom: "18%",
        left: "12%",
        size: "2.7rem",
        delay: "1s",
    },
    {
        emoji: "🤑",
        bottom: "12%",
        right: "10%",
        size: "2.9rem",
        delay: "1.5s",
    },
    {
        emoji: "💵",
        top: "60%",
        right: "5%",
        size: "2.3rem",
        delay: "2s",
    },
    {
        emoji: "🎉",
        bottom: "8%",
        left: "20%",
        size: "2.6rem",
        delay: "2.5s",
    },
];

export const MoneySavedFrame = ({ amount }: MoneySavedFrameProps) => (
    <StoryFrameTemplate
        gradient="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600"
        emojis={moneySavedEmojis}
    >
        <h2 className="text-2xl font-light opacity-90">You saved</h2>
        <div className="text-7xl font-bold">${amount.toFixed(0)}</div>
        <p className="text-xl opacity-80">this year on deals & discounts</p>
        {amount > 200 && (
            <div className="text-lg opacity-70">🎉 Smart shopper!</div>
        )}
    </StoryFrameTemplate>
);
