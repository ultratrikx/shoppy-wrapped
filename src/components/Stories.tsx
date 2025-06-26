import { useState, useEffect, useRef } from "react";
import { useShare } from "@shopify/shop-minis-react";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";
import "./Stories.css";
import { useUserDataAggregate } from "../App";

// Updated stories with emojis
const stories = [
    {
        id: 1,
        text: "Welcome to your Shoppy Wrapped! ✨",
        emoji: "🎁",
        duration: 5000,
    },
    {
        id: 2,
        text: "Let's see what you've been shopping...",
        emoji: "🛍️",
        duration: 5000,
    },
    {
        id: 3,
        text: "Check out your shopping stats below!",
        emoji: "📊",
        duration: 5000,
    },
];

// Food and fun emojis for floating animations (from newStories.tsx)
const FOOD_EMOJIS = [
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

// Emoji animations for stats
const emojiMap = {
    productsBought: ["🛒", "📦", "🧺", "👕", "👟"],
    totalSaved: ["💰", "💵", "💸", "🤑", "💲"],
    shoppingStreak: ["🔥", "📆", "⚡", "🏆", "✅"],
    topVendor: ["🏪", "👑", "🥇", "⭐", "🌟"],
};

// Helper functions from newStories.tsx
function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const generateRandomGradient = () => {
    // Aesthetic gradients
    const gradients = [
        "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
        "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
        "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
        "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        "linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)",
        "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
        // Adding from newStories.tsx
        "linear-gradient(135deg, #a259c6 0%, #f15baf 100%)",
    ];

    return gradients[Math.floor(Math.random() * gradients.length)];
};

const Stories = () => {
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [gradient, setGradient] = useState(generateRandomGradient());
    const { share } = useShare();
    const storyRef = useRef<HTMLDivElement>(null);
    const userData = useUserDataAggregate();
    const [showStats, setShowStats] = useState(false);
    const [animateEmojis, setAnimateEmojis] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [backgroundEmojis, setBackgroundEmojis] = useState<
        { emoji: string; style: React.CSSProperties }[]
    >([]);
    const touchStartX = useRef<number | null>(null);

    // Start with analyzing screen, then move to stories
    useEffect(() => {
        // Generate random background emojis
        const chosenEmoji =
            FOOD_EMOJIS[getRandomInt(0, FOOD_EMOJIS.length - 1)];
        const emojis = Array.from({ length: getRandomInt(5, 8) }).map(() => ({
            emoji: chosenEmoji,
            style: {
                top: `${getRandomInt(5, 80)}%`,
                left: `${getRandomInt(5, 80)}%`,
                fontSize: `${getRandomInt(32, 64)}px`,
                transform: `rotate(${getRandomInt(-30, 30)}deg)`,
            },
        }));
        setBackgroundEmojis(emojis);

        // Show analyzing screen for 2.5 seconds
        const timer = setTimeout(() => {
            setIsAnalyzing(false);
            // Clear background emojis when analysis is complete
            setBackgroundEmojis([]);
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    // Removed auto-advancing timer to only proceed when tapped or swiped

    useEffect(() => {
        // Reset animations when changing stories
        setAnimateEmojis(false);
        setShowStats(false);

        // Start emoji animations after a short delay
        const emojiTimer = setTimeout(() => {
            setAnimateEmojis(true);
        }, 500);

        // Show stats after emojis animate
        const statsTimer = setTimeout(() => {
            setShowStats(true);
        }, 2000);

        return () => {
            clearTimeout(emojiTimer);
            clearTimeout(statsTimer);
        };
    }, [currentStoryIndex]);

    // Touch/swipe navigation from newStories.tsx
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;

        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (delta < -50) {
            // Swipe left - next story
            setCurrentStoryIndex(
                (prevIndex) => (prevIndex + 1) % stories.length
            );
            setGradient(generateRandomGradient());
        } else if (delta > 50) {
            // Swipe right - previous story
            setCurrentStoryIndex(
                (prevIndex) => (prevIndex - 1 + stories.length) % stories.length
            );
            setGradient(generateRandomGradient());
        }

        touchStartX.current = null;
    };

    const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isAnalyzing) {
            setIsAnalyzing(false);
            return;
        }

        const { clientX } = e;
        const { offsetWidth } = e.currentTarget;
        const tapPosition = clientX / offsetWidth;

        if (tapPosition > 0.3) {
            setCurrentStoryIndex(
                (prevIndex) => (prevIndex + 1) % stories.length
            );
        } else {
            setCurrentStoryIndex(
                (prevIndex) => (prevIndex - 1 + stories.length) % stories.length
            );
        }
        setGradient(generateRandomGradient());
    };

    const handleShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        try {
            if (storyRef.current) {
                // Get references to UI elements we want to hide during screenshot
                const storyHeader =
                    storyRef.current.querySelector(".story-header");
                const navigationHint =
                    storyRef.current.querySelector(".navigation-hint");

                // Store original display values
                let headerDisplayStyle = "";
                let hintDisplayStyle = "";

                // Temporarily hide UI elements for the screenshot
                if (storyHeader) {
                    headerDisplayStyle = (storyHeader as HTMLElement).style
                        .display;
                    (storyHeader as HTMLElement).style.display = "none";
                }

                if (navigationHint) {
                    hintDisplayStyle = (navigationHint as HTMLElement).style
                        .display;
                    (navigationHint as HTMLElement).style.display = "none";
                }

                // Take the screenshot without UI elements
                const canvas = await html2canvas(storyRef.current, {
                    useCORS: true,
                    scale: 2, // Higher scale for better quality
                    logging: false,
                    allowTaint: true,
                    backgroundColor: null,
                });

                // Restore UI elements
                if (storyHeader) {
                    (storyHeader as HTMLElement).style.display =
                        headerDisplayStyle;
                }

                if (navigationHint) {
                    (navigationHint as HTMLElement).style.display =
                        hintDisplayStyle;
                }

                // Get data URL for sharing
                const imageUrl = canvas.toDataURL("image/png", 0.9);

                // Share the image using Shopify's share functionality
                share({
                    type: "image",
                    url: imageUrl,
                });

                // Alternate sharing method from newStories if needed
                try {
                    const blob = await (await fetch(imageUrl)).blob();
                    const file = new File([blob], "shoppy-wrapped-story.png", {
                        type: "image/png",
                    });

                    // Only use this if the Shopify share fails
                    if (
                        !share &&
                        navigator.canShare &&
                        navigator.canShare({ files: [file] })
                    ) {
                        await navigator.share({
                            files: [file],
                            title: "Shopify Wrapped Story",
                            text: "Check out my Shopify Wrapped story!",
                        });
                    }
                } catch (err) {
                    // Fallback already attempted with Shopify share
                    console.error("Alternative sharing failed:", err);
                }
            }
        } catch (error) {
            console.error("Error capturing or sharing screenshot:", error);
        }
    };

    // Render floating emoji animations
    const renderFloatingEmojis = (emojiList: string[]) => {
        if (!animateEmojis) return null;

        return emojiList.map((emoji, index) => (
            <motion.div
                key={index}
                className="floating-emoji"
                initial={{
                    opacity: 0,
                    scale: 0,
                    x: Math.random() * 200 - 100,
                    y: Math.random() * 200 - 100,
                }}
                animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.5, 1, 0],
                    x: Math.random() * 300 - 150,
                    y: Math.random() * 300 - 150,
                    rotate: Math.random() * 360,
                }}
                transition={{
                    duration: 2,
                    delay: index * 0.2,
                    ease: "easeInOut",
                }}
            >
                {emoji}
            </motion.div>
        ));
    };

    // Background floating emojis
    const renderBackgroundEmojis = () => {
        return backgroundEmojis.map((item, index) => (
            <div key={index} className="background-emoji" style={item.style}>
                {item.emoji}
            </div>
        ));
    };

    return (
        <div
            className="stories-container"
            onClick={handleTap}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ background: gradient }}
            ref={storyRef}
        >
            {/* Render background emojis only during analyzing stage */}
            {isAnalyzing && renderBackgroundEmojis()}

            {/* Analyzing Screen */}
            {isAnalyzing ? (
                <div className="analyzing-screen">
                    <div className="spinner"></div>
                    <div className="analyzing-title">
                        analyzing your shopping...
                    </div>
                    <div className="analyzing-subtitle">
                        reading your shopping DNA ✨
                    </div>
                </div>
            ) : (
                <>
                    {/* Regular Story Content */}
                    <div className="story-header">
                        <div className="story-progress-bar">
                            {stories.map((_, index) => (
                                <div
                                    key={index}
                                    className={`progress-segment ${
                                        index < currentStoryIndex
                                            ? "viewed"
                                            : ""
                                    } ${
                                        index === currentStoryIndex
                                            ? "active-no-animation"
                                            : ""
                                    }`}
                                />
                            ))}
                        </div>
                        <button onClick={handleShare} className="share-button">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                                <polyline points="16 6 12 2 8 6"></polyline>
                                <line x1="12" y1="2" x2="12" y2="15"></line>
                            </svg>
                        </button>
                    </div>

                    <div className="story-content">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStoryIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="story-text-container"
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                        duration: 0.7,
                                        type: "spring",
                                    }}
                                    className="story-emoji"
                                >
                                    {stories[currentStoryIndex].emoji}
                                </motion.div>
                                <p>{stories[currentStoryIndex].text}</p>
                            </motion.div>
                        </AnimatePresence>

                        {currentStoryIndex === 2 && (
                            <div className="user-stats-wrapper">
                                {/* Products Bought Stat */}
                                <motion.div
                                    className="stat-card"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{
                                        opacity: showStats ? 1 : 0,
                                        scale: showStats ? 1 : 0.8,
                                    }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                >
                                    {renderFloatingEmojis(
                                        emojiMap.productsBought
                                    )}
                                    <div className="stat-item">
                                        <motion.span
                                            className="stat-value"
                                            initial={{ opacity: 0 }}
                                            animate={{
                                                opacity: showStats ? 1 : 0,
                                            }}
                                            transition={{
                                                duration: 0.3,
                                                delay: 2.2,
                                            }}
                                        >
                                            {userData.productsBought}
                                        </motion.span>
                                        <span className="stat-label">
                                            Products Purchased
                                        </span>
                                    </div>
                                </motion.div>

                                {/* Total Saved Stat */}
                                <motion.div
                                    className="stat-card"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{
                                        opacity: showStats ? 1 : 0,
                                        scale: showStats ? 1 : 0.8,
                                    }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                >
                                    {renderFloatingEmojis(emojiMap.totalSaved)}
                                    <div className="stat-item">
                                        <motion.span
                                            className="stat-value"
                                            initial={{ opacity: 0 }}
                                            animate={{
                                                opacity: showStats ? 1 : 0,
                                            }}
                                            transition={{
                                                duration: 0.3,
                                                delay: 2.4,
                                            }}
                                        >
                                            ${userData.totalSaved}
                                        </motion.span>
                                        <span className="stat-label">
                                            Total Saved
                                        </span>
                                    </div>
                                </motion.div>

                                {/* Shopping Streak Stat */}
                                <motion.div
                                    className="stat-card"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{
                                        opacity: showStats ? 1 : 0,
                                        scale: showStats ? 1 : 0.8,
                                    }}
                                    transition={{ duration: 0.5, delay: 0.5 }}
                                >
                                    {renderFloatingEmojis(
                                        emojiMap.shoppingStreak
                                    )}
                                    <div className="stat-item">
                                        <motion.span
                                            className="stat-value"
                                            initial={{ opacity: 0 }}
                                            animate={{
                                                opacity: showStats ? 1 : 0,
                                            }}
                                            transition={{
                                                duration: 0.3,
                                                delay: 2.6,
                                            }}
                                        >
                                            {userData.shoppingStreak}
                                        </motion.span>
                                        <span className="stat-label">
                                            Day Streak
                                        </span>
                                    </div>
                                </motion.div>

                                {/* Top Vendor Stat */}
                                {userData.topVendors &&
                                    userData.topVendors.length > 0 && (
                                        <motion.div
                                            className="stat-card vendor-card"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{
                                                opacity: showStats ? 1 : 0,
                                                scale: showStats ? 1 : 0.8,
                                            }}
                                            transition={{
                                                duration: 0.5,
                                                delay: 0.7,
                                            }}
                                        >
                                            {renderFloatingEmojis(
                                                emojiMap.topVendor
                                            )}
                                            <div className="top-vendor">
                                                <span className="vendor-label">
                                                    Top Shop:
                                                </span>
                                                <motion.span
                                                    className="vendor-name"
                                                    initial={{ opacity: 0 }}
                                                    animate={{
                                                        opacity: showStats
                                                            ? 1
                                                            : 0,
                                                    }}
                                                    transition={{
                                                        duration: 0.3,
                                                        delay: 2.8,
                                                    }}
                                                >
                                                    {
                                                        userData.topVendors[0]
                                                            ?.vendor
                                                    }
                                                </motion.span>
                                            </div>
                                        </motion.div>
                                    )}
                            </div>
                        )}
                    </div>

                    {/* Navigation hint (from newStories.tsx) */}
                    <div className="navigation-hint">
                        {currentStoryIndex < stories.length - 1
                            ? "Tap or swipe to continue →"
                            : "← Swipe right to go back"}
                    </div>
                </>
            )}
        </div>
    );
};

export default Stories;
