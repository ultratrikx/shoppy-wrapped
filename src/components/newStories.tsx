import React, { useEffect, useRef, useState } from "react";
import { useUserSummaryDescription } from "./userSummary";
import html2canvas from "html2canvas";

const gradient = "linear-gradient(135deg, #a259c6 0%, #f15baf 100%)";
const EMOJIS = [
    "🍵",
    "🧋",
    "🍰",
    "🧁",
    "🍩",
    "🍦",
    "🍪",
    "🍉",
    "🍓",
    "🍒",
    "🍇",
    "🍊",
    "🍋",
    "🍎",
    "🥝",
    "🥑",
    "🥥",
    "🍬",
    "🍭",
    "🍫",
];

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function FloatingEmoji({
    emoji,
    style,
}: {
    emoji: string;
    style: React.CSSProperties;
}) {
    return (
        <span style={{ position: "absolute", pointerEvents: "none", ...style }}>
            {emoji}
        </span>
    );
}

export function PersonaStories({ onClose }: { onClose?: () => void }) {
    const { description, loading } = useUserSummaryDescription();
    const [screen, setScreen] = useState(0); // 0 = loading, 1 = reveal
    const [emojis, setEmojis] = useState<
        { emoji: string; style: React.CSSProperties }[]
    >([]);
    const touchStartX = useRef<number | null>(null);
    const storyRef = useRef<HTMLDivElement>(null);

    // Generate random emojis for the reveal screen
    useEffect(() => {
        if (screen === 1) {
            const chosen = EMOJIS[getRandomInt(0, EMOJIS.length - 1)];
            const arr = Array.from({ length: getRandomInt(5, 8) }).map(() => ({
                emoji: chosen,
                style: {
                    top: `${getRandomInt(5, 80)}%`,
                    left: `${getRandomInt(5, 80)}%`,
                    fontSize: `${getRandomInt(32, 64)}px`,
                    transform: `rotate(${getRandomInt(-30, 30)}deg)`,
                },
            }));
            setEmojis(arr);
        }
    }, [screen]);

    // Auto-advance to reveal screen when persona is ready
    useEffect(() => {
        if (!loading && description.length > 0 && screen === 0) {
            const t = setTimeout(() => setScreen(1), 1200);
            return () => clearTimeout(t);
        }
    }, [loading, description, screen]);

    // Touch/swipe navigation
    function handleTouchStart(e: React.TouchEvent) {
        touchStartX.current = e.touches[0].clientX;
    }
    function handleTouchEnd(e: React.TouchEvent) {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (delta < -50 && screen === 0) setScreen(1); // swipe left
        if (delta > 50 && screen === 1) setScreen(0); // swipe right
        touchStartX.current = null;
    }
    // Tap navigation
    function handleClick() {
        setScreen((s) => (s === 0 ? 1 : 0));
    }

    async function handleShare(e: React.MouseEvent) {
        e.stopPropagation(); // Prevent triggering navigation
        if (!storyRef.current) return;
        try {
            const canvas = await html2canvas(storyRef.current, {
                backgroundColor: null,
                useCORS: true,
            });
            const dataUrl = canvas.toDataURL("image/png");
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], "shopify-wrapped-story.png", {
                type: "image/png",
            });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: "Shopify Wrapped Persona",
                    text: "Check out my Shopify Wrapped persona!",
                });
            } else {
                // Fallback: download the image
                const link = document.createElement("a");
                link.href = dataUrl;
                link.download = "shopify-wrapped-story.png";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (err) {
            alert(
                "Unable to share image. Try updating your browser or use the download option."
            );
        }
    }

    return (
        <div
            ref={storyRef}
            style={{
                minHeight: "100vh",
                minWidth: "100vw",
                background: gradient,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                borderRadius: 32,
                overflow: "hidden",
                touchAction: "pan-y",
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={handleClick}
        >
            {/* Top-right controls */}
            <div
                style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    zIndex: 20,
                    display: "flex",
                    gap: 8,
                }}
            >
                <button
                    onClick={handleShare}
                    style={{
                        background: "rgba(255,255,255,0.95)",
                        color: "#a259c6",
                        border: "none",
                        borderRadius: 999,
                        padding: "8px 18px",
                        fontWeight: 700,
                        fontSize: 16,
                        boxShadow: "0 2px 8px #0002",
                        cursor: "pointer",
                    }}
                    aria-label="Share story"
                >
                    Share
                </button>
                {onClose && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        style={{
                            background: "rgba(255,255,255,0.95)",
                            color: "#a259c6",
                            border: "none",
                            borderRadius: 999,
                            padding: "8px 18px",
                            fontWeight: 700,
                            fontSize: 16,
                            boxShadow: "0 2px 8px #0002",
                            cursor: "pointer",
                        }}
                        aria-label="Close story"
                    >
                        Close
                    </button>
                )}
            </div>
            {/* Progress bar */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: 8,
                    background: "#fff2",
                    zIndex: 2,
                }}
            >
                <div
                    style={{
                        width: screen === 0 ? "50%" : "100%",
                        height: "100%",
                        background: "#fff",
                        borderRadius: 8,
                        transition: "width 0.7s cubic-bezier(.4,2,.6,1)",
                    }}
                />
            </div>
            {/* Floating emojis on reveal screen */}
            {screen === 1 &&
                emojis.map((e, i) => (
                    <FloatingEmoji key={i} emoji={e.emoji} style={e.style} />
                ))}
            <div
                style={{
                    width: "100%",
                    maxWidth: 400,
                    margin: "0 auto",
                    padding: "64px 16px 32px 16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                }}
            >
                {screen === 0 ? (
                    <>
                        <div style={{ marginBottom: 32 }}>
                            <div
                                className="animate-spin"
                                style={{
                                    border: "4px solid #fff4",
                                    borderTop: "4px solid #fff",
                                    borderRadius: "50%",
                                    width: 64,
                                    height: 64,
                                    margin: "0 auto",
                                    borderRight: "4px solid transparent",
                                    borderBottom: "4px solid transparent",
                                }}
                            />
                        </div>
                        <div
                            style={{
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: 24,
                                textAlign: "center",
                                marginBottom: 8,
                            }}
                        >
                            analyzing your persona...
                        </div>
                        <div
                            style={{
                                color: "#fff",
                                fontWeight: 400,
                                fontSize: 16,
                                textAlign: "center",
                                opacity: 0.8,
                            }}
                        >
                            reading your shopping DNA ✨
                        </div>
                    </>
                ) : (
                    <>
                        <div
                            style={{
                                color: "#fff",
                                fontWeight: 400,
                                fontSize: 20,
                                textAlign: "center",
                                marginBottom: 16,
                            }}
                        >
                            your personality is
                        </div>
                        <div
                            style={{
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: 28,
                                textAlign: "center",
                                marginBottom: 8,
                                lineHeight: 1.3,
                                textShadow: "0 2px 8px #0002",
                            }}
                        >
                            {description.join(", ")} {emojis[0]?.emoji}
                        </div>
                    </>
                )}
            </div>
            {/* Story navigation hint (optional) */}
            <div
                style={{
                    position: "absolute",
                    bottom: 16,
                    left: 0,
                    width: "100%",
                    textAlign: "center",
                    color: "#fff8",
                    fontSize: 14,
                    zIndex: 3,
                }}
            >
                {screen === 0
                    ? "Tap or swipe to continue →"
                    : "← Swipe or tap to go back"}
            </div>
        </div>
    );
}
