import {
    usePopularProducts,
    useOrders,
    useSavedProducts,
    useRecommendedProducts,
    useRecommendedShops,
    useAsyncStorage,
} from "@shopify/shop-minis-react";
import { useEffect, useMemo, useState } from "react";

function getVendor(product: any) {
    return product.vendor || "Mock Vendor " + ((product.id % 3) + 1);
}

export function useUserDataAggregate() {
    const { products } = usePopularProducts();
    const { orders } = useOrders();
    const { products: savedProducts } = useSavedProducts({ first: 10 });
    const { products: recommendedProducts } = useRecommendedProducts({
        first: 4,
    });
    const { shops: recommendedShops } = useRecommendedShops({ first: 4 });
    const { getItem, setItem } = useAsyncStorage();
    const [streak, setStreak] = useState(1);
    const [lastOrderDate, setLastOrderDate] = useState<string | null>(null);

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

    // Vendor Stats
    const vendorStats = useMemo(() => {
        if (!Array.isArray(products)) return [];
        const vendorMap: Record<string, number> = {};
        products.forEach((product: any) => {
            const vendor = getVendor(product);
            if (!vendorMap[vendor]) vendorMap[vendor] = 0;
            vendorMap[vendor]++;
        });
        return Object.entries(vendorMap).map(([vendor, count]) => ({
            vendor,
            count: count as number,
            topPercent: Math.floor(Math.random() * 100) + 1, // 1-100%
        }));
    }, [products]);

    // Shopping Streak (simulate with local storage)
    function getToday() {
        return new Date().toISOString().slice(0, 10);
    }
    function getYesterday() {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().slice(0, 10);
    }
    useEffect(() => {
        async function checkStreak() {
            if (!orders || orders.length === 0) return;
            const today = getToday();
            const yesterday = getYesterday();
            const lastDate = await getItem({ key: "lastOrderDate" });
            const streakCount = await getItem({ key: "orderStreak" });
            if (lastDate === yesterday) {
                const newStreak = (
                    parseInt(streakCount || "1", 10) + 1
                ).toString();
                await setItem({ key: "orderStreak", value: newStreak });
                await setItem({ key: "lastOrderDate", value: today });
                setStreak(parseInt(newStreak, 10));
                setLastOrderDate(today);
            } else if (lastDate === today) {
                setStreak(parseInt(streakCount || "1", 10));
                setLastOrderDate(today);
            } else {
                await setItem({ key: "orderStreak", value: "1" });
                await setItem({ key: "lastOrderDate", value: today });
                setStreak(1);
                setLastOrderDate(today);
            }
        }
        checkStreak();
    }, [orders, getItem, setItem]);

    return {
        productsBought: purchaseSummary.totalBought,
        totalSaved: purchaseSummary.totalSaved,
        discountedProducts: purchaseSummary.products,
        topVendors: vendorStats,
        shoppingStreak: streak,
        recommendedProducts,
        recommendedShops,
        orders,
        savedProducts,
        allProducts: products,
    };
}
