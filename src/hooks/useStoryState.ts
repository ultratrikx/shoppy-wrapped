import { useState, useEffect } from "react";
import {
    useOrders,
    useCurrentUser,
    useSavedProducts,
} from "@shopify/shop-minis-react";
import { useShoppingAnalytics, type ShoppingStats } from "./useShoppingData";

export const storyFrames = [
    "welcome",
    "analyzing",
    "totalSpent",
    "ordersCount",
    "moneySaved",
    "favoriteShop",
    "topProduct",
    "shoppingStyle",
    "yearInNumbers",
    "allItems",
    "personality",
    "share",
] as const;

export type StoryFrame = (typeof storyFrames)[number];

interface UseStoryStateReturn {
    currentFrame: StoryFrame;
    currentFrameIndex: number;
    stats: ShoppingStats;
    isAnalyzing: boolean;
    progress: number;
    personaError: string | null;
    hasAnalyzed: boolean;
    startAnalyzing: () => void;
    nextFrame: () => void;
    prevFrame: () => void;
}

export const useStoryState = (): UseStoryStateReturn => {
    const { orders } = useOrders();
    const currentUser = useCurrentUser();
    const { products: savedProducts } = useSavedProducts();
    const { analyzeData } = useShoppingAnalytics();

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
    const [personaError, setPersonaError] = useState<string | null>(null);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);

    useEffect(() => {
        if (currentFrame === "analyzing" && !hasAnalyzed) {
            let progressInterval: NodeJS.Timeout;
            const startProgressAnimation = () => {
                let currentProgress = 0;
                progressInterval = setInterval(() => {
                    currentProgress += 2;
                    if (currentProgress > 95) {
                        clearInterval(progressInterval);
                    } else {
                        setProgress(currentProgress);
                    }
                }, 50);
            };

            const loadData = async () => {
                startProgressAnimation();

                try {
                    const data = await analyzeData();
                    if (data) {
                        setStats(data);
                        setPersonaError(null);
                        setProgress(100);
                        setHasAnalyzed(true);

                        // Give a moment to show 100% before moving to next frame
                        setTimeout(() => {
                            setIsAnalyzing(false);
                            nextFrame();
                        }, 500);
                    }
                } catch (error: any) {
                    console.error("Error analyzing data:", error);
                    setPersonaError(error?.message || String(error));
                    setProgress(100);
                    setHasAnalyzed(true);

                    setTimeout(() => {
                        setIsAnalyzing(false);
                        nextFrame();
                    }, 500);
                }
            };

            const ready =
                orders &&
                orders.length > 0 &&
                currentUser &&
                savedProducts !== undefined;
            if (ready) {
                loadData();
            }

            return () => {
                if (progressInterval) {
                    clearInterval(progressInterval);
                }
            };
        }
    }, [
        currentFrame,
        hasAnalyzed,
        orders,
        currentUser,
        savedProducts,
        analyzeData,
    ]);

    const startAnalyzing = () => {
        setCurrentFrame("analyzing");
        setCurrentFrameIndex(1);
        setIsAnalyzing(true);
        setProgress(0);
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

    return {
        currentFrame,
        currentFrameIndex,
        stats,
        isAnalyzing,
        progress,
        personaError,
        hasAnalyzed,
        startAnalyzing,
        nextFrame,
        prevFrame,
    };
};
