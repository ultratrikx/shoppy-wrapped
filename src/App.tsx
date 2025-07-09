import { useState, useRef, useEffect } from "react";
import { useShare } from "@shopify/shop-minis-react";
import html2canvas from "html2canvas";
import { useStoryState, storyFrames } from "./hooks/useStoryState";

// Frame components
import { WelcomeFrame } from "./components/frames/WelcomeFrame";
import { AnalyzingFrame } from "./components/frames/AnalyzingFrame";
import { TotalSpentFrame } from "./components/frames/TotalSpentFrame";
import { MoneySavedFrame } from "./components/frames/MoneySavedFrame";
import { OrdersCountFrame } from "./components/frames/OrdersCountFrame";
import { FavoriteShopFrame } from "./components/frames/FavoriteShopFrame";
import { TopProductFrame } from "./components/frames/TopProductFrame";
import { ShoppingStyleFrame } from "./components/frames/ShoppingStyleFrame";
import { YearInNumbersFrame } from "./components/frames/YearInNumbersFrame";
import { AllItemsFrame } from "./components/frames/AllItemsFrame";
import { PersonalityFrame } from "./components/frames/PersonalityFrame";
import { ShareFrame } from "./components/frames/ShareFrame";

export function App() {
    const { share } = useShare();
    const {
        currentFrame,
        currentFrameIndex,
        stats,
        isAnalyzing,
        progress,
        personaError,
        startAnalyzing,
        nextFrame,
        prevFrame,
    } = useStoryState();

    const [isCapturing, setIsCapturing] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const shareFrameRef = useRef<HTMLDivElement>(null);

    // Minimum distance for a swipe
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && currentFrame !== "analyzing") {
            nextFrame();
        } else if (isRightSwipe && currentFrameIndex > 0) {
            prevFrame();
        }

        setTouchStart(null);
        setTouchEnd(null);
    };

    // Mouse swipe handling
    const [mouseStart, setMouseStart] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const onMouseDown = (e: React.MouseEvent) => {
        setMouseStart(e.clientX);
        setIsDragging(true);
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;

        const distance = mouseStart! - e.clientX;
        // Only prevent default if we detect a significant drag
        if (Math.abs(distance) > minSwipeDistance) {
            e.preventDefault();
        }
    };

    const onMouseUp = (e: React.MouseEvent) => {
        if (!mouseStart || !isDragging) return;

        const distance = mouseStart - e.clientX;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && currentFrame !== "analyzing") {
            nextFrame();
        } else if (isRightSwipe && currentFrameIndex > 0) {
            prevFrame();
        }

        setMouseStart(null);
        setIsDragging(false);
    };

    const onMouseLeave = () => {
        setMouseStart(null);
        setIsDragging(false);
    };

    const shareWrapped = async () => {
        if (share) {
            try {
                await share({
                    title: "My Shopping Wrapped 2024",
                    url: window.location.href,
                });
            } catch (error) {
                console.log("Share failed:", error);
            }
        }
    };

    const captureAndShareToInstagram = async () => {
        if (!shareFrameRef.current) return;

        setIsCapturing(true);

        try {
            const canvas = await html2canvas(shareFrameRef.current, {
                backgroundColor: "#EC4899",
                scale: 2,
                useCORS: true,
                allowTaint: true,
                width: shareFrameRef.current.offsetWidth,
                height: shareFrameRef.current.offsetHeight,
                logging: false,
                removeContainer: false,
            });

            canvas.toBlob(
                async (blob) => {
                    if (!blob) {
                        console.error("Failed to create blob from canvas");
                        setIsCapturing(false);
                        return;
                    }

                    const isMobile =
                        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                            navigator.userAgent
                        );

                    // Try Web Share API first (modern browsers)
                    if (navigator.share && navigator.canShare) {
                        const file = new File(
                            [blob],
                            "shopping-wrapped-2024.png",
                            {
                                type: "image/png",
                                lastModified: Date.now(),
                            }
                        );

                        if (navigator.canShare({ files: [file] })) {
                            try {
                                await navigator.share({
                                    title: "Shopping Wrapped 2024",
                                    files: [file],
                                });
                                setIsCapturing(false);
                                return;
                            } catch (shareError) {
                                console.log(
                                    "Web Share API failed:",
                                    shareError
                                );
                            }
                        }
                    }

                    // Create download URL for fallback
                    const url = URL.createObjectURL(blob);

                    if (isMobile) {
                        try {
                            const downloadLink = document.createElement("a");
                            downloadLink.href = url;
                            downloadLink.download = "shopping-wrapped-2024.png";
                            downloadLink.style.display = "none";
                            document.body.appendChild(downloadLink);
                            downloadLink.click();
                            document.body.removeChild(downloadLink);

                            setTimeout(() => {
                                try {
                                    window.location.href =
                                        "instagram://story-camera";
                                } catch (error) {
                                    console.log("Instagram app not available");
                                }
                                alert(
                                    "Image saved to your device! 📱\n\n1. Open Instagram\n2. Tap your story camera\n3. Select the image from your gallery\n4. Share your Shopping Wrapped!"
                                );
                            }, 500);
                        } catch (error) {
                            console.error("Mobile share failed:", error);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = "shopping-wrapped-2024.png";
                            link.click();
                            alert(
                                "Image downloaded! Share it to your Instagram Story! 📱"
                            );
                        }
                    } else {
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = "shopping-wrapped-2024.png";
                        link.click();
                        alert(
                            "Image downloaded! 💻\n\nTransfer it to your phone and share to Instagram Stories!"
                        );
                    }

                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    setIsCapturing(false);
                },
                "image/png",
                0.95
            );
        } catch (error) {
            console.error("Failed to capture image:", error);
            setIsCapturing(false);
            shareWrapped();
            alert("Image capture failed. Try the text sharing option instead!");
        }
    };

    const renderFrame = () => {
        switch (currentFrame) {
            case "welcome":
                return <WelcomeFrame onStart={startAnalyzing} />;
            case "analyzing":
                return <AnalyzingFrame progress={progress} />;
            case "totalSpent":
                return <TotalSpentFrame amount={stats.totalSpent} />;
            case "moneySaved":
                return <MoneySavedFrame amount={stats.moneySaved || 0} />;
            case "ordersCount":
                return <OrdersCountFrame count={stats.totalOrders} />;
            case "favoriteShop":
                return <FavoriteShopFrame shop={stats.favoriteShop} />;
            case "topProduct":
                return (
                    <TopProductFrame
                        product={stats.topProduct}
                        productId={stats.topProductId}
                    />
                );
            case "shoppingStyle":
                return <ShoppingStyleFrame stats={stats} />;
            case "yearInNumbers":
                return <YearInNumbersFrame stats={stats} />;
            case "allItems":
                return <AllItemsFrame items={stats.allPurchasedItems || []} />;
            case "personality":
                return (
                    <PersonalityFrame
                        stats={stats}
                        personaError={personaError}
                    />
                );
            case "share":
                return (
                    <div ref={shareFrameRef}>
                        <ShareFrame
                            stats={stats}
                            onShare={shareWrapped}
                            onInstagramShare={captureAndShareToInstagram}
                            isCapturing={isCapturing}
                            personaError={personaError}
                        />
                    </div>
                );
            default:
                return <WelcomeFrame onStart={startAnalyzing} />;
        }
    };

    return (
        <div
            className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-pink-500 to-purple-600"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
        >
            {/* Progress bar */}
            <div className="absolute top-4 left-4 right-4 z-50">
                <div className="flex gap-1">
                    {storyFrames.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                index <= currentFrameIndex
                                    ? "bg-white"
                                    : "bg-white/30"
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Frame content */}
            <div className="h-full w-full">{renderFrame()}</div>

            {/* Optional swipe hint - shows briefly when the component mounts */}
            {currentFrameIndex === 0 && (
                <div className="absolute bottom-8 left-0 right-0 text-center text-white/70 text-sm animate-fade-out">
                    Swipe to navigate ←→
                </div>
            )}
        </div>
    );
}
