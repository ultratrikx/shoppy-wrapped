import { ReactNode } from "react";

export interface Emoji {
    emoji: string;
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    size?: string;
    delay?: string;
    rotate?: string;
    zIndex?: number;
}

interface StoryFrameTemplateProps {
    gradient: string;
    children: ReactNode;
    emojis: Emoji[];
}

export const AnimatedEmojis = ({ emojis }: { emojis: Emoji[] }) => (
    <>
        {emojis.map((e, i) => (
            <div
                key={i}
                className={`absolute animate-float`}
                style={{
                    top: e.top,
                    bottom: e.bottom,
                    left: e.left,
                    right: e.right,
                    fontSize: e.size || "2rem",
                    animationDelay: e.delay || "0s",
                    transform: e.rotate ? `rotate(${e.rotate})` : undefined,
                    zIndex: e.zIndex || 1,
                    pointerEvents: "none",
                    userSelect: "none",
                }}
            >
                {e.emoji}
            </div>
        ))}
    </>
);

export const StoryFrameTemplate = ({
    gradient,
    children,
    emojis,
}: StoryFrameTemplateProps) => (
    <div
        className={`h-full ${gradient} flex flex-col items-center justify-center text-white p-8 relative overflow-hidden`}
    >
        <AnimatedEmojis emojis={emojis} />
        <div className="text-center space-y-8 z-10">{children}</div>
    </div>
);
