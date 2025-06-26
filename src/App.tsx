import { useState, useEffect, useRef, useMemo } from "react";
import {
    useOrders,
    useCurrentUser,
    useSavedProducts,
    useRecentProducts,
    useFollowedShops,
    useRecommendedProducts,
    useShare,
} from "@shopify/shop-minis-react";
import html2canvas from "html2canvas";
import { generateShoppingPersona } from "./services/openai";

interface ShoppingStats {
    totalOrders: number;
    totalProducts: number;
    savedProductsCount: number;
    uniqueShops: number;
    totalSpent: number;
    favoriteShop?: string;
    topProduct?: string;
    shoppingStreak: number;
    avgOrderValue: number;
    topCategory?: string;
    persona?: string;
    personaDescription?: string;
    moneySaved?: number; // Add moneySaved to stats
}

const storyFrames = [
    "welcome",
    "analyzing",
    "totalSpent",
    "ordersCount",
    "moneySaved", // Added moneySaved frame
    "favoriteShop",
    "topProduct",
    "shoppingStyle",
    "yearInNumbers",
    "personality",
    "share",
] as const;

type StoryFrame = (typeof storyFrames)[number];

export function App() {
    const { orders } = useOrders();
    const currentUser = useCurrentUser();
    const { products: savedProducts } = useSavedProducts();
    const { products: recentProducts } = useRecentProducts();
    const { shops: followedShops } = useFollowedShops();
    const { products: recommendedProducts } = useRecommendedProducts();
    const { share } = useShare();

    const [currentFrame, setCurrentFrame] = useState<StoryFrame>("welcome");
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [stats, setStats] = useState<ShoppingStats>({
        totalOrders: 0,
        totalProducts: 0,
        savedProductsCount: 0,
        uniqueShops: 0,
        totalSpent: 0,
        shoppingStreak: 0,
        avgOrderValue: 0,
    });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isCapturing, setIsCapturing] = useState(false);
    const [personaError, setPersonaError] = useState<string | null>(null);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);

    // Ref for capturing the share frame
    const shareFrameRef = useRef<HTMLDivElement>(null);

    // Purchase & Discount Summary
    const purchaseSummary = useMemo(() => {
        if (!orders || orders.length === 0) {
            return {
                totalBought: 0,
                totalSaved: 0,
                products: [],
            };
        }
        let totalBought = 0;
        let totalSaved = 0;
        const discountedProducts: {
            name: string;
            originalPrice: number;
            discountedPrice: number;
            saved: number;
        }[] = [];
        orders.forEach((order) => {
            order.lineItems.forEach((item) => {
                const product = item.product;
                if (!product) return;
                const quantity = item.quantity || 1;
                const price = Number(product.price?.amount || 0);
                const compareAt = Number(
                    product.compareAtPrice?.amount || price
                );
                totalBought += quantity;
                if (compareAt > price) {
                    const saved = (compareAt - price) * quantity;
                    totalSaved += saved;
                    discountedProducts.push({
                        name: product.title,
                        originalPrice: compareAt,
                        discountedPrice: price,
                        saved: +saved.toFixed(2),
                    });
                }
            });
        });
        return {
            totalBought,
            totalSaved: +totalSaved.toFixed(2),
            products: discountedProducts,
        };
    }, [orders]);

    useEffect(() => {
        const ready =
            orders &&
            orders.length > 0 &&
            currentUser &&
            savedProducts !== undefined;
        if (!hasAnalyzed && ready) {
            setHasAnalyzed(true); // Set before calling to prevent race
            analyzeShoppingData();
        }
    }, [orders, currentUser, savedProducts, hasAnalyzed]);

    const analyzeShoppingData = async () => {
        if (!orders || orders.length === 0) return;

        // Calculate comprehensive stats
        const totalOrders = orders.length;
        const totalProducts = orders.reduce(
            (acc, order) => acc + (order.lineItems?.length || 0),
            0
        );
        const uniqueShops = new Set(orders.map((order) => order.shop?.name))
            .size;

        const totalSpent = orders.reduce((acc, order) => {
            // Use estimated total since exact totalPrice might not be available
            const lineItemsTotal =
                order.lineItems?.reduce(
                    (itemAcc, item) => itemAcc + (item.quantity || 1),
                    0
                ) || 0;
            return acc + lineItemsTotal * 50; // Estimate $50 per item as fallback
        }, 0);

        const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

        // Find favorite shop (most orders from)
        const shopCounts = orders.reduce((acc, order) => {
            const shopName = order.shop?.name || "Unknown Shop";
            acc[shopName] = (acc[shopName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const favoriteShop = Object.entries(shopCounts).sort(
            ([, a], [, b]) => b - a
        )[0]?.[0];

        // Find top product (most quantity ordered)
        const productCounts = orders.reduce((acc, order) => {
            order.lineItems?.forEach((item) => {
                const title = item.productTitle || "Unknown Product";
                acc[title] = (acc[title] || 0) + (item.quantity || 1);
            });
            return acc;
        }, {} as Record<string, number>);

        const topProduct = Object.entries(productCounts).sort(
            ([, a], [, b]) => b - a
        )[0]?.[0];

        // Get top products for OpenAI analysis
        const topProducts = Object.entries(productCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // Calculate shopping streak (consecutive months with orders)
        // Use current date as fallback since createdAt might not be available
        const orderDates = orders
            .map(() => new Date())
            .sort((a, b) => b.getTime() - a.getTime());
        let streak = 0;
        if (orderDates.length > 0) {
            const now = new Date();
            let currentMonth = now.getMonth();
            let currentYear = now.getFullYear();

            for (const date of orderDates) {
                if (
                    date.getMonth() === currentMonth &&
                    date.getFullYear() === currentYear
                ) {
                    streak++;
                    currentMonth--;
                    if (currentMonth < 0) {
                        currentMonth = 11;
                        currentYear--;
                    }
                } else {
                    break;
                }
            }
        }

        // Get top ordered vendors
        const topOrderedVendors = Object.entries(shopCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([vendor, orderCount]) => ({ vendor, orderCount }));

        // Initial stats - don't set stats yet until we have the persona
        const initialStats = {
            totalOrders,
            totalProducts,
            savedProductsCount: savedProducts?.length || 0,
            uniqueShops,
            totalSpent,
            favoriteShop,
            topProduct,
            shoppingStreak: streak,
            avgOrderValue,
            topCategory: "Fashion", // Could be derived from product data
            moneySaved: purchaseSummary.totalSaved, // Use real value
        };

        // Instead of setting stats immediately, wait for OpenAI response
        // This ensures persona is available right when frames are first displayed
        try {
            const personaData = await generateShoppingPersona({
                topOrderedVendors,
                productsBought: totalProducts,
                moneySpent: totalSpent,
                totalSaved: purchaseSummary.totalSaved, // Use real value
                topProducts,
            });
            setStats({
                ...initialStats,
                persona: personaData.persona,
                personaDescription: personaData.description,
            });
            setPersonaError(null);
        } catch (error: any) {
            console.error("Error generating shopping persona:", error);
            setStats(initialStats);
            setPersonaError(error?.message || String(error));
        }
    };

    const nextFrame = () => {
        const nextIndex = (currentFrameIndex + 1) % storyFrames.length;
        setCurrentFrameIndex(nextIndex);
        setCurrentFrame(storyFrames[nextIndex]);
    };

    const prevFrame = () => {
        const prevIndex =
            currentFrameIndex === 0
                ? storyFrames.length - 1
                : currentFrameIndex - 1;
        setCurrentFrameIndex(prevIndex);
        setCurrentFrame(storyFrames[prevIndex]);
    };

    const startAnalyzing = () => {
        setCurrentFrame("analyzing");
        setCurrentFrameIndex(1);
        setIsAnalyzing(true);
        setProgress(0);
        // Only analyze if not already done and data is ready
        const ready =
            orders &&
            orders.length > 0 &&
            currentUser &&
            savedProducts !== undefined;
        if (!hasAnalyzed && ready) {
            setHasAnalyzed(true); // Set before calling to prevent race
            analyzeShoppingData();
        }
    };

    // Animate progress bar when in analyzing frame
    useEffect(() => {
        if (currentFrame === "analyzing") {
            setProgress(0);
            setIsAnalyzing(true);
            let progressValue = 0;
            const interval = setInterval(() => {
                progressValue += 10;
                setProgress(progressValue);
                if (progressValue >= 100) {
                    clearInterval(interval);
                    setIsAnalyzing(false);
                    setTimeout(() => {
                        nextFrame();
                    }, 400); // Short pause before next frame
                }
            }, 300);
            return () => clearInterval(interval);
        }
    }, [currentFrame]);

    const captureAndShareToInstagram = async () => {
        if (!shareFrameRef.current) {
            console.error("Share frame ref not available");
            return;
        }

        setIsCapturing(true);

        try {
            // Capture the share frame as an image
            const canvas = await html2canvas(shareFrameRef.current, {
                backgroundColor: "#EC4899", // Pink background to match gradient
                scale: 2, // High quality for mobile
                useCORS: true,
                allowTaint: true,
                width: shareFrameRef.current.offsetWidth,
                height: shareFrameRef.current.offsetHeight,
                logging: false,
                removeContainer: false,
            });

            // Convert to blob for sharing
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
                        // Mobile: Try to open Instagram and provide download
                        try {
                            // Create download link
                            const downloadLink = document.createElement("a");
                            downloadLink.href = url;
                            downloadLink.download = "shopping-wrapped-2024.png";
                            downloadLink.style.display = "none";
                            document.body.appendChild(downloadLink);
                            downloadLink.click();
                            document.body.removeChild(downloadLink);

                            // Try to open Instagram after a short delay
                            setTimeout(() => {
                                try {
                                    // Instagram story camera URL
                                    window.location.href =
                                        "instagram://story-camera";
                                } catch (error) {
                                    console.log("Instagram app not available");
                                }

                                // Show instructions
                                alert(
                                    "Image saved to your device! 📱\n\n1. Open Instagram\n2. Tap your story camera\n3. Select the image from your gallery\n4. Share your Shopping Wrapped!"
                                );
                            }, 500);
                        } catch (error) {
                            console.error("Mobile share failed:", error);
                            // Fallback to regular download
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = "shopping-wrapped-2024.png";
                            link.click();
                            alert(
                                "Image downloaded! Share it to your Instagram Story! 📱"
                            );
                        }
                    } else {
                        // Desktop: Download the image
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = "shopping-wrapped-2024.png";
                        link.click();
                        alert(
                            "Image downloaded! 💻\n\nTransfer it to your phone and share to Instagram Stories!"
                        );
                    }

                    // Clean up the URL
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    setIsCapturing(false);
                },
                "image/png",
                0.95
            );
        } catch (error) {
            console.error("Failed to capture image:", error);
            setIsCapturing(false);

            // Fallback to text sharing
            shareWrapped();
            alert("Image capture failed. Try the text sharing option instead!");
        }
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
                return <TopProductFrame product={stats.topProduct} />;

            case "shoppingStyle":
                return <ShoppingStyleFrame stats={stats} />;

            case "yearInNumbers":
                return <YearInNumbersFrame stats={stats} />;

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
        <div className="relative h-screen w-full overflow-hidden">
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

            {/* Navigation overlay - hide during capture */}
            {!isCapturing && (
                <div className="absolute inset-0 z-40 flex">
                    <button
                        className="flex-1 h-full"
                        onClick={prevFrame}
                        disabled={currentFrameIndex === 0}
                    />
                    <button
                        className="flex-1 h-full"
                        onClick={nextFrame}
                        disabled={currentFrame === "analyzing" && isAnalyzing}
                    />
                </div>
            )}

            {/* Frame content */}
            <div className="h-full w-full">{renderFrame()}</div>
        </div>
    );
}

// Welcome Frame
const WelcomeFrame = ({ onStart }: { onStart: () => void }) => (
    <div className="h-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
        <AnimatedEmojis
            emojis={[
                {
                    emoji: "🛍️",
                    top: "8%",
                    left: "6%",
                    size: "4.5rem",
                    delay: "0s",
                },
                {
                    emoji: "✨",
                    top: "18%",
                    right: "8%",
                    size: "2.5rem",
                    delay: "0.4s",
                },
                {
                    emoji: "🎉",
                    bottom: "20%",
                    left: "10%",
                    size: "3.8rem",
                    delay: "0.8s",
                },
                {
                    emoji: "💙",
                    bottom: "10%",
                    right: "7%",
                    size: "2.2rem",
                    delay: "1.2s",
                },
                {
                    emoji: "🛒",
                    top: "50%",
                    left: "2%",
                    size: "2.7rem",
                    delay: "1.6s",
                },
                {
                    emoji: "👟",
                    bottom: "8%",
                    right: "20%",
                    size: "3.2rem",
                    delay: "2s",
                },
            ]}
        />
        <div className="text-center space-y-8">
            <div className="text-6xl mb-4">🛍️</div>
            <h1 className="text-4xl font-bold">
                Shopping
                <br />
                Wrapped
            </h1>
            <p className="text-lg opacity-80">
                Your year in shopping,
                <br />
                beautifully visualized
            </p>
            <button
                onClick={onStart}
                className="mt-12 px-8 py-4 bg-white text-blue-700 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
                Let's dive in
            </button>
        </div>
        <div className="absolute bottom-8 text-sm opacity-60">
            Tap to navigate →
        </div>
    </div>
);

// Analyzing Frame
const AnalyzingFrame = ({ progress }: { progress: number }) => (
    <div className="h-full bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
        <AnimatedEmojis
            emojis={[
                {
                    emoji: "🔎",
                    top: "10%",
                    left: "8%",
                    size: "4rem",
                    delay: "0s",
                },
                {
                    emoji: "🧠",
                    top: "20%",
                    right: "10%",
                    size: "2.7rem",
                    delay: "0.5s",
                },
                {
                    emoji: "📊",
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
                    emoji: "⏳",
                    top: "60%",
                    right: "5%",
                    size: "2.9rem",
                    delay: "2s",
                },
                {
                    emoji: "🤖",
                    bottom: "8%",
                    left: "20%",
                    size: "3.5rem",
                    delay: "2.5s",
                },
            ]}
        />
        <div className="text-center space-y-8">
            <div className="relative">
                <div className="w-24 h-24 border-4 border-white/30 rounded-full animate-spin">
                    <div className="w-full h-full border-4 border-white border-b-transparent rounded-full"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-2xl">
                    {progress}%
                </div>
            </div>
            <h2 className="text-3xl font-bold">
                Analyzing your
                <br />
                shopping journey...
            </h2>
            <p className="text-lg opacity-80">Crunching the numbers ✨</p>
        </div>
    </div>
);

// Reusable animated emoji component
const AnimatedEmojis = ({
    emojis,
}: {
    emojis: Array<{
        emoji: string;
        top?: string;
        bottom?: string;
        left?: string;
        right?: string;
        size?: string;
        delay?: string;
        rotate?: string;
        zIndex?: number;
    }>;
}) => (
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

// Add keyframes for floating animation
// Add this to your global CSS (e.g., index.css):
// @keyframes float {
//   0% { transform: translateY(0) scale(1) rotate(0deg); }
//   50% { transform: translateY(-20px) scale(1.1) rotate(5deg); }
//   100% { transform: translateY(0) scale(1) rotate(0deg); }
// }
// .animate-float { animation: float 3s ease-in-out infinite; }

// Total Spent Frame
const TotalSpentFrame = ({ amount }: { amount: number }) => (
    <div className="h-full bg-gradient-to-br from-green-500 via-green-600 to-green-700 flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
        <AnimatedEmojis
            emojis={[
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
            ]}
        />
        <div className="text-center space-y-8 z-10">
            <h2 className="text-2xl font-light opacity-90">You spent</h2>
            <div className="text-7xl font-bold">${amount.toFixed(0)}</div>
            <p className="text-xl opacity-80">this year on shopping</p>
            {amount > 1000 && (
                <div className="text-lg opacity-70">🎉 Big spender alert!</div>
            )}
        </div>
    </div>
);

// Money Saved Frame
const MoneySavedFrame = ({ amount }: { amount: number }) => (
    <div className="h-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
        <AnimatedEmojis
            emojis={[
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
            ]}
        />
        <div className="text-center space-y-8 z-10">
            <h2 className="text-2xl font-light opacity-90">You saved</h2>
            <div className="text-7xl font-bold">${amount.toFixed(0)}</div>
            <p className="text-xl opacity-80">this year on deals & discounts</p>
            {amount > 200 && (
                <div className="text-lg opacity-70">🎉 Smart shopper!</div>
            )}
        </div>
    </div>
);

// Orders Count Frame
const OrdersCountFrame = ({ count }: { count: number }) => (
    <div className="h-full bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
        <AnimatedEmojis
            emojis={[
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
            ]}
        />
        <div className="text-center space-y-8">
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
        </div>
    </div>
);

// Favorite Shop Frame
const FavoriteShopFrame = ({ shop }: { shop?: string }) => (
    <div className="h-full bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700 flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
        <AnimatedEmojis
            emojis={[
                {
                    emoji: "🏪",
                    top: "10%",
                    left: "8%",
                    size: "4.2rem",
                    delay: "0s",
                },
                {
                    emoji: "🛍️",
                    top: "20%",
                    right: "10%",
                    size: "2.8rem",
                    delay: "0.5s",
                },
                {
                    emoji: "💖",
                    bottom: "18%",
                    left: "12%",
                    size: "3.5rem",
                    delay: "1s",
                },
                {
                    emoji: "🧁",
                    bottom: "12%",
                    right: "10%",
                    size: "2.3rem",
                    delay: "1.5s",
                },
                {
                    emoji: "🎀",
                    top: "60%",
                    right: "5%",
                    size: "2.7rem",
                    delay: "2s",
                },
                {
                    emoji: "🛒",
                    bottom: "8%",
                    left: "20%",
                    size: "3.1rem",
                    delay: "2.5s",
                },
            ]}
        />
        <div className="text-center space-y-8">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-light opacity-90">
                Your favorite shop
            </h2>
            <div className="text-3xl font-bold max-w-xs">
                {shop || "Multiple shops"}
            </div>
            <p className="text-lg opacity-80">Where you love to shop most</p>
        </div>
    </div>
);

// Top Product Frame
const TopProductFrame = ({ product }: { product?: string }) => (
    <div className="h-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
        <AnimatedEmojis
            emojis={[
                {
                    emoji: "⭐",
                    top: "10%",
                    left: "8%",
                    size: "4.2rem",
                    delay: "0s",
                },
                {
                    emoji: "👟",
                    top: "20%",
                    right: "10%",
                    size: "2.8rem",
                    delay: "0.5s",
                },
                {
                    emoji: "🧢",
                    bottom: "18%",
                    left: "12%",
                    size: "3.5rem",
                    delay: "1s",
                },
                {
                    emoji: "👗",
                    bottom: "12%",
                    right: "10%",
                    size: "2.3rem",
                    delay: "1.5s",
                },
                {
                    emoji: "👜",
                    top: "60%",
                    right: "5%",
                    size: "2.7rem",
                    delay: "2s",
                },
                {
                    emoji: "🎒",
                    bottom: "8%",
                    left: "20%",
                    size: "3.1rem",
                    delay: "2.5s",
                },
            ]}
        />
        <div className="text-center space-y-8">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-2xl font-light opacity-90">
                Most ordered item
            </h2>
            <div className="text-2xl font-bold max-w-xs">
                {product || "Various products"}
            </div>
            <p className="text-lg opacity-80">Your go-to purchase</p>
        </div>
    </div>
);

// Shopping Style Frame
const ShoppingStyleFrame = ({ stats }: { stats: ShoppingStats }) => (
    <div className="h-full bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
        <AnimatedEmojis
            emojis={[
                {
                    emoji: "🎨",
                    top: "10%",
                    left: "8%",
                    size: "4.2rem",
                    delay: "0s",
                },
                {
                    emoji: "🧥",
                    top: "20%",
                    right: "10%",
                    size: "2.8rem",
                    delay: "0.5s",
                },
                {
                    emoji: "👖",
                    bottom: "18%",
                    left: "12%",
                    size: "3.5rem",
                    delay: "1s",
                },
                {
                    emoji: "👟",
                    bottom: "12%",
                    right: "10%",
                    size: "2.3rem",
                    delay: "1.5s",
                },
                {
                    emoji: "🕶️",
                    top: "60%",
                    right: "5%",
                    size: "2.7rem",
                    delay: "2s",
                },
                {
                    emoji: "🧢",
                    bottom: "8%",
                    left: "20%",
                    size: "3.1rem",
                    delay: "2.5s",
                },
            ]}
        />
        <div className="text-center space-y-8">
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-2xl font-light opacity-90">
                Your shopping style
            </h2>
            <div className="text-3xl font-bold">
                {stats.avgOrderValue > 100
                    ? "Premium Collector"
                    : stats.totalOrders > 30
                    ? "Frequent Explorer"
                    : stats.savedProductsCount > 20
                    ? "Wishlist Curator"
                    : "Mindful Shopper"}
            </div>
            <p className="text-lg opacity-80">
                ${stats.avgOrderValue.toFixed(0)} average order
            </p>
        </div>
    </div>
);

// Year in Numbers Frame
const YearInNumbersFrame = ({ stats }: { stats: ShoppingStats }) => (
    <div className="h-full bg-gradient-to-br from-red-500 via-red-600 to-red-700 flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
        <AnimatedEmojis
            emojis={[
                {
                    emoji: "🔢",
                    top: "10%",
                    left: "8%",
                    size: "4.2rem",
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
                    emoji: "🛒",
                    bottom: "18%",
                    left: "12%",
                    size: "3.5rem",
                    delay: "1s",
                },
                {
                    emoji: "🏬",
                    bottom: "12%",
                    right: "10%",
                    size: "2.3rem",
                    delay: "1.5s",
                },
                {
                    emoji: "🗓️",
                    top: "60%",
                    right: "5%",
                    size: "2.7rem",
                    delay: "2s",
                },
                {
                    emoji: "💯",
                    bottom: "8%",
                    left: "20%",
                    size: "3.1rem",
                    delay: "2.5s",
                },
            ]}
        />
        <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold mb-8">Your year in numbers</h2>
            <div className="grid grid-cols-2 gap-6 max-w-sm">
                <div className="text-center">
                    <div className="text-4xl font-bold">
                        {stats.totalProducts}
                    </div>
                    <div className="text-sm opacity-80">items ordered</div>
                </div>
                <div className="text-center">
                    <div className="text-4xl font-bold">
                        {stats.savedProductsCount}
                    </div>
                    <div className="text-sm opacity-80">items saved</div>
                </div>
                <div className="text-center">
                    <div className="text-4xl font-bold">
                        {stats.uniqueShops}
                    </div>
                    <div className="text-sm opacity-80">shops visited</div>
                </div>
                <div className="text-center">
                    <div className="text-4xl font-bold">
                        {stats.shoppingStreak}
                    </div>
                    <div className="text-sm opacity-80">month streak</div>
                </div>
            </div>
        </div>
    </div>
);

// Personality Frame
const PersonalityFrame = ({
    stats,
    personaError,
}: {
    stats: ShoppingStats;
    personaError: string | null;
}) => (
    <div className="h-full bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
        <AnimatedEmojis
            emojis={[
                {
                    emoji: "✨",
                    top: "10%",
                    left: "8%",
                    size: "4.2rem",
                    delay: "0s",
                },
                {
                    emoji: "🧑‍🎤",
                    top: "20%",
                    right: "10%",
                    size: "2.8rem",
                    delay: "0.5s",
                },
                {
                    emoji: "🦸‍♂️",
                    bottom: "18%",
                    left: "12%",
                    size: "3.5rem",
                    delay: "1s",
                },
                {
                    emoji: "🦄",
                    bottom: "12%",
                    right: "10%",
                    size: "2.3rem",
                    delay: "1.5s",
                },
                {
                    emoji: "💡",
                    top: "60%",
                    right: "5%",
                    size: "2.7rem",
                    delay: "2s",
                },
                {
                    emoji: "🎭",
                    bottom: "8%",
                    left: "20%",
                    size: "3.1rem",
                    delay: "2.5s",
                },
            ]}
        />
        <div className="text-center space-y-8">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-2xl font-light opacity-90">You are a</h2>
            {stats.persona ? (
                <>
                    <div className="text-3xl font-bold italic">
                        {stats.persona}
                    </div>
                    <p className="text-lg opacity-80 max-w-xs">
                        {stats.personaDescription ||
                            "Your shopping style is uniquely you."}
                    </p>
                </>
            ) : personaError ? (
                <div className="text-red-300 mt-4">
                    Could not generate persona.
                    <br />
                    <span className="text-xs break-all">{personaError}</span>
                </div>
            ) : (
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-white/30 rounded-full animate-spin">
                        <div className="w-full h-full border-4 border-white border-b-transparent rounded-full"></div>
                    </div>
                    <p className="mt-4 text-lg opacity-80">
                        Generating your persona...
                    </p>
                </div>
            )}
        </div>
    </div>
);

// Share Frame with Instagram image capture
const ShareFrame = ({
    stats,
    onShare,
    onInstagramShare,
    isCapturing,
    personaError,
}: {
    stats: ShoppingStats;
    onShare: () => void;
    onInstagramShare: () => void;
    isCapturing: boolean;
    personaError: string | null;
}) => (
    <div className="h-full bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600 flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
        {/* No AnimatedEmojis here, share screen is clean */}
        <div className="text-center space-y-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold">
                Shopping Wrapped
                <br />
                2024
            </h2>
            {stats.persona ? (
                <>
                    <div className="text-2xl font-bold italic mt-4">
                        {stats.persona}
                    </div>
                    {stats.personaDescription && (
                        <p className="text-lg opacity-90 max-w-xs">
                            "{stats.personaDescription}"
                        </p>
                    )}
                </>
            ) : personaError ? (
                <div className="text-red-300 mt-4">
                    Could not generate persona.
                    <br />
                    <span className="text-xs break-all">{personaError}</span>
                </div>
            ) : (
                <div className="italic text-xl opacity-90 mt-4">
                    Generating your persona...
                </div>
            )}
            <div className="space-y-4 opacity-90">
                <p className="text-xl">${stats.totalSpent.toFixed(0)} spent</p>
                <p className="text-xl">{stats.totalOrders} orders placed</p>
                <p className="text-xl">{stats.uniqueShops} shops explored</p>
                {stats.favoriteShop && (
                    <p className="text-lg opacity-80">
                        Favorite: {stats.favoriteShop}
                    </p>
                )}
            </div>
            {/* Share buttons */}
            <div className="flex flex-col gap-4 mt-8">
                <button
                    onClick={onInstagramShare}
                    disabled={isCapturing}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isCapturing ? (
                        <span className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Creating image...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            📸 Share to Instagram Story
                        </span>
                    )}
                </button>
                <button
                    onClick={onShare}
                    className="px-8 py-4 bg-white/20 text-white rounded-full font-semibold text-lg hover:bg-white/30 transition-colors"
                >
                    🔗 Share link
                </button>
            </div>
            <p className="text-sm opacity-60 mt-4">Thanks for shopping! 💕</p>
        </div>
    </div>
);
