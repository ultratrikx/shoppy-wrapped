import { useState, useEffect, useRef } from "react";
import { useShare } from "@shopify/shop-minis-react";
import html2canvas from "html2canvas";
import "./Stories.css";
import { useUserDataAggregate } from "../App";

const stories = [
    {
        id: 1,
        text: "Welcome to your Shoppy Wrapped!",
        duration: 5000,
    },
    {
        id: 2,
        text: "Let's see what you've been shopping...",
        duration: 5000,
    },
    {
        id: 3,
        text: "Check out your shopping stats below!",
        duration: 5000,
    },
];

const generateRandomGradient = () => {
    const colors = [
        "#ff9a9e",
        "#fad0c4",
        "#fad0c4",
        "#ff9a9e",
        "#fbc2eb",
        "#a6c1ee",
        "#a1c4fd",
        "#c2e9fb",
        "#d4fc79",
        "#96e6a1",
        "#84fab0",
        "#8fd3f4",
        "#fccb90",
        "#d57eeb",
        "#e0c3fc",
        "#8ec5fc",
        "#f093fb",
        "#f5576c",
        "#4facfe",
        "#00f2fe",
    ];
    const color1 = colors[Math.floor(Math.random() * colors.length)];
    const color2 = colors[Math.floor(Math.random() * colors.length)];
    return `linear-gradient(45deg, ${color1}, ${color2})`;
};

const Stories = () => {
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [gradient, setGradient] = useState(generateRandomGradient());
    const { share } = useShare();
    const storyRef = useRef<HTMLDivElement>(null);
    const userData = useUserDataAggregate();

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStoryIndex(
                (prevIndex) => (prevIndex + 1) % stories.length
            );
            setGradient(generateRandomGradient());
        }, stories[currentStoryIndex].duration);

        return () => clearInterval(interval);
    }, [currentStoryIndex]);

    const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
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

                // Store original display values
                let headerDisplayStyle = "";

                // Temporarily hide UI elements for the screenshot
                if (storyHeader) {
                    headerDisplayStyle = (storyHeader as HTMLElement).style
                        .display;
                    (storyHeader as HTMLElement).style.display = "none";
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

                // Get data URL for sharing
                const imageUrl = canvas.toDataURL("image/png", 0.9);

                // Log for debugging
                console.log(
                    "Sharing image with URL:",
                    imageUrl.substring(0, 50) + "..."
                );

                // Share the image using Shopify's share functionality
                share({
                    type: "image",
                    url: imageUrl,
                });
            }
        } catch (error) {
            console.error("Error capturing or sharing screenshot:", error);
        }
    };

    return (
        <div
            className="stories-container"
            onClick={handleTap}
            style={{ background: gradient }}
            ref={storyRef}
        >
            <div className="story-header">
                <div className="story-progress-bar">
                    {stories.map((_, index) => (
                        <div
                            key={index}
                            className={`progress-segment ${
                                index < currentStoryIndex ? "viewed" : ""
                            } ${index === currentStoryIndex ? "active" : ""}`}
                            style={{
                                animationDuration: `${stories[currentStoryIndex].duration}ms`,
                            }}
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
                <p>{stories[currentStoryIndex].text}</p>

                {currentStoryIndex === 2 && (
                    <div className="user-stats">
                        <div className="stat-item">
                            <span className="stat-value">
                                {userData.productsBought}
                            </span>
                            <span className="stat-label">
                                Products Purchased
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">
                                ${userData.totalSaved}
                            </span>
                            <span className="stat-label">Total Saved</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">
                                {userData.shoppingStreak}
                            </span>
                            <span className="stat-label">Day Streak</span>
                        </div>
                        {userData.topVendors &&
                            userData.topVendors.length > 0 && (
                                <div className="top-vendor">
                                    <span className="vendor-label">
                                        Top Shop:
                                    </span>
                                    <span className="vendor-name">
                                        {userData.topVendors[0]?.vendor}
                                    </span>
                                </div>
                            )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Stories;
