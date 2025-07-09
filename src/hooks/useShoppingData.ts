import { useMemo } from "react";
import { useOrders, useSavedProducts } from "@shopify/shop-minis-react";
import { generateShoppingPersona } from "../services/openai";

export interface ShoppingStats {
    totalOrders: number;
    totalProducts: number;
    savedProductsCount: number;
    uniqueShops: number;
    totalSpent: number;
    favoriteShop?: string;
    topProduct?: string;
    topProductId?: string;
    shoppingStreak: number;
    avgOrderValue: number;
    topCategory?: string;
    persona?: string;
    personaDescription?: string;
    moneySaved?: number;
    allPurchasedItems?: Array<{
        id: string;
        title: string;
        quantity: number;
    }>;
}

export const useDiscountSummary = () => {
    const { orders } = useOrders();

    return useMemo(() => {
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
};

export const useShoppingAnalytics = () => {
    const { orders } = useOrders();
    const { products: savedProducts } = useSavedProducts();
    const discountSummary = useDiscountSummary();

    const analyzeData = async () => {
        if (!orders || orders.length === 0) return null;

        const totalOrders = orders.length;
        const totalProducts = orders.reduce(
            (acc, order) => acc + (order.lineItems?.length || 0),
            0
        );
        const uniqueShops = new Set(orders.map((order) => order.shop?.name))
            .size;

        const totalSpent = orders.reduce((acc, order) => {
            const lineItemsTotal =
                order.lineItems?.reduce(
                    (itemAcc, item) => itemAcc + (item.quantity || 1),
                    0
                ) || 0;
            return acc + lineItemsTotal * 50;
        }, 0);

        const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

        // Shop analysis
        const shopCounts = orders.reduce((acc, order) => {
            const shopName = order.shop?.name || "Unknown Shop";
            acc[shopName] = (acc[shopName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const favoriteShop = Object.entries(shopCounts).sort(
            ([, a], [, b]) => b - a
        )[0]?.[0];

        // Product analysis
        const productCounts = orders.reduce((acc, order) => {
            order.lineItems?.forEach((item) => {
                const title = item.productTitle || "Unknown Product";
                const productId = item.product?.id;
                if (!acc[title]) {
                    acc[title] = { count: 0, productId };
                }
                acc[title].count += item.quantity || 1;
            });
            return acc;
        }, {} as Record<string, { count: number; productId?: string }>);

        const topProductEntry = Object.entries(productCounts).sort(
            ([, a], [, b]) => b.count - a.count
        )[0];

        const topProduct = topProductEntry?.[0];
        const topProductId = topProductEntry?.[1]?.productId;

        const allPurchasedItems = Object.entries(productCounts).map(
            ([title, data]) => ({
                id: data.productId || "",
                title,
                quantity: data.count,
            })
        );

        // Shopping streak calculation
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

        // Get top ordered vendors for persona
        const topOrderedVendors = Object.entries(shopCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([vendor, orderCount]) => ({ vendor, orderCount }));

        // Get top products for OpenAI analysis
        const topProducts = Object.entries(productCounts)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 5)
            .map(([name, data]) => ({ name, count: data.count }));

        try {
            const personaData = await generateShoppingPersona({
                topOrderedVendors,
                productsBought: totalProducts,
                moneySpent: totalSpent,
                totalSaved: discountSummary.totalSaved,
                topProducts,
            });

            return {
                totalOrders,
                totalProducts,
                savedProductsCount: savedProducts?.length || 0,
                uniqueShops,
                totalSpent,
                favoriteShop,
                topProduct,
                topProductId,
                shoppingStreak: streak,
                avgOrderValue,
                topCategory: "Fashion",
                moneySaved: discountSummary.totalSaved,
                allPurchasedItems,
                persona: personaData.persona,
                personaDescription: personaData.description,
            } as ShoppingStats;
        } catch (error) {
            console.error("Error generating shopping persona:", error);
            throw error;
        }
    };

    return { analyzeData };
};
