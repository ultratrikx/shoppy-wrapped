import Stories from "./components/Stories";
import {
    // usePopularProducts,
    // ProductCard,
    useOrders,
    useRecentProducts,
    useBuyerAttributes,
    useCurrentUser,
    useSavedProducts,
    useFollowedShops,
    useRecentShops,
    usePopularProducts,
    useRecommendedProducts,
    useRecommendedShops,
    useAsyncStorage,
    // MerchantCard,
} from "@shopify/shop-minis-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { generateShoppingPersona } from "./services/openai";

function getVendor(product: any) {
    return product.vendor || "Shop Vendor " + ((product.id % 3) + 1);
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
            topPercent: Math.floor(Math.random() * 20) + 80, // 1-100%
        }));
    }, [products]);

    // Top 5 vendors by order count
    const topOrderedVendors = useMemo(() => {
        if (!orders || orders.length === 0) return [];

        const vendorOrderMap: Record<string, number> = {};

        // Count orders per vendor
        orders.forEach((order) => {
            order.lineItems.forEach((item) => {
                const product = item.product;
                if (!product) return;

                const vendor = getVendor(product);
                if (!vendorOrderMap[vendor]) vendorOrderMap[vendor] = 0;
                vendorOrderMap[vendor]++;
            });
        });

        // Convert to array and sort by order count
        const vendorArray = Object.entries(vendorOrderMap)
            .map(([vendor, orderCount]) => ({
                vendor,
                orderCount,
            }))
            .sort((a, b) => b.orderCount - a.orderCount)
            .slice(0, 5); // Get top 5

        return vendorArray;
    }, [orders]);

    // Top purchased products
    const topPurchasedProducts = useMemo(() => {
        if (!orders || orders.length === 0) return [];

        const productCountMap: Record<string, number> = {};

        // Count product purchases
        orders.forEach((order) => {
            order.lineItems.forEach((item) => {
                const product = item.product;
                if (!product || !product.title) return;

                const productName = product.title;
                const quantity = item.quantity || 1;

                if (!productCountMap[productName]) {
                    productCountMap[productName] = 0;
                }
                productCountMap[productName] += quantity;
            });
        });

        // Convert to array and sort by purchase count
        const productsArray = Object.entries(productCountMap)
            .map(([name, count]) => ({
                name,
                count,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 100); // Get top 100

        return productsArray;
    }, [orders]);

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
            } else if (lastDate === today) {
                setStreak(parseInt(streakCount || "1", 10));
            } else {
                await setItem({ key: "orderStreak", value: "1" });
                await setItem({ key: "lastOrderDate", value: today });
                setStreak(1);
            }
        }
        checkStreak();
    }, [orders, getItem, setItem]);

    // Money spent calculations
    const moneySpentData = useMemo(() => {
        if (!orders || orders.length === 0) {
            return {
                totalSpent: 0,
                highestSpendingDay: { date: null, amount: 0 },
                dailySpending: [],
            };
        }

        let totalSpent = 0;
        const dailySpendingMap: Record<string, number> = {};

        // Calculate total spent and daily spending
        orders.forEach((order) => {
            // Extract date from order - use a fallback since we don't have processedAt
            // For demo purposes, create a random date within the last year
            const randomDate = new Date();
            randomDate.setDate(
                randomDate.getDate() - Math.floor(Math.random() * 365)
            );
            const dateKey = randomDate.toISOString().split("T")[0]; // YYYY-MM-DD format

            // Calculate order total
            let orderTotal = 0;
            order.lineItems.forEach((item) => {
                const product = item.product;
                if (!product) return;
                const quantity = item.quantity || 1;
                const price = Number(product.price?.amount || 0);
                orderTotal += price * quantity;
            });

            // Add to total spent
            totalSpent += orderTotal;

            // Add to daily spending
            if (!dailySpendingMap[dateKey]) {
                dailySpendingMap[dateKey] = 0;
            }
            dailySpendingMap[dateKey] += orderTotal;
        });

        // Find highest spending day
        let highestSpendingDay = { date: null as string | null, amount: 0 };
        Object.entries(dailySpendingMap).forEach(([date, amount]) => {
            if (amount > highestSpendingDay.amount) {
                highestSpendingDay = {
                    date,
                    amount: +amount.toFixed(2),
                };
            }
        });

        // Format date for display if we have one
        const formattedHighestDay = highestSpendingDay.date
            ? {
                  date: highestSpendingDay.date,
                  amount: highestSpendingDay.amount,
                  formattedDate: new Date(
                      highestSpendingDay.date
                  ).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                  }),
              }
            : { date: null, amount: 0, formattedDate: "No data" };

        // Convert daily spending map to array
        const dailySpending = Object.entries(dailySpendingMap)
            .map(([date, amount]) => ({
                date,
                amount: +amount.toFixed(2),
                formattedDate: new Date(date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                }),
            }))
            .sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
            );

        return {
            totalSpent: +totalSpent.toFixed(2),
            highestSpendingDay: formattedHighestDay,
            dailySpending,
        };
    }, [orders]);

    // Comparison with average user (simulated data)
    const comparisonData = useMemo(() => {
        // Generate simulated average user data
        const avgUserSpent = 867.5; // Average user spent $867.50 this year
        const avgUserSaved = 245.3; // Average user saved $245.30 this year

        const totalSpent = moneySpentData.totalSpent;
        const totalSaved = purchaseSummary.totalSaved;

        // Calculate percentage difference from average
        const spentDiffPercentage =
            avgUserSpent > 0
                ? Math.round(((totalSpent - avgUserSpent) / avgUserSpent) * 100)
                : 0;

        const savedDiffPercentage =
            avgUserSaved > 0
                ? Math.round(((totalSaved - avgUserSaved) / avgUserSaved) * 100)
                : 0;

        // Generate meaningful messages based on comparison
        const spendingMessage =
            totalSpent > avgUserSpent
                ? `You spent ${Math.abs(
                      spentDiffPercentage
                  )}% more than the average shopper`
                : `You spent ${Math.abs(
                      spentDiffPercentage
                  )}% less than the average shopper`;

        const savingMessage =
            totalSaved > avgUserSaved
                ? `You saved ${Math.abs(
                      savedDiffPercentage
                  )}% more than the average shopper`
                : `You saved ${Math.abs(
                      savedDiffPercentage
                  )}% less than the average shopper`;

        return {
            avgUserSpent,
            avgUserSaved,
            spentDiffPercentage,
            savedDiffPercentage,
            aboveAvgSpending: totalSpent > avgUserSpent,
            aboveAvgSaving: totalSaved > avgUserSaved,
            spendingMessage,
            savingMessage,
        };
    }, [moneySpentData.totalSpent, purchaseSummary.totalSaved]);

    // Shopping persona generation
    const [shoppingPersona, setShoppingPersona] = useState<{
        persona: string;
        description: string;
        isLoading: boolean;
        error: string | null;
    }>({
        persona: "",
        description: "",
        isLoading: false,
        error: null,
    });

    // Function to generate shopping persona
    const generatePersona = useCallback(async () => {
        if (!orders || orders.length === 0 || topOrderedVendors.length === 0)
            return;

        // Don't re-generate if we already have a persona and no errors
        if (shoppingPersona.persona && !shoppingPersona.error) return;

        setShoppingPersona((prev) => ({
            ...prev,
            isLoading: true,
            error: null,
        }));

        try {
            const result = await generateShoppingPersona({
                topOrderedVendors,
                productsBought: purchaseSummary.totalBought,
                moneySpent: moneySpentData.totalSpent,
                totalSaved: purchaseSummary.totalSaved,
                topProducts: topPurchasedProducts,
            });

            setShoppingPersona({
                persona: result.persona,
                description: result.description,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            console.error("Failed to generate shopping persona:", error);
            setShoppingPersona((prev) => ({
                ...prev,
                isLoading: false,
                error: "Failed to generate your shopping persona.",
            }));
        }
    }, [
        orders,
        topOrderedVendors,
        topPurchasedProducts,
        purchaseSummary.totalBought,
        moneySpentData.totalSpent,
        purchaseSummary.totalSaved,
        shoppingPersona.persona,
    ]);

    // Generate persona when data is available
    useEffect(() => {
        generatePersona();
    }, [generatePersona]);

    return {
        productsBought: purchaseSummary.totalBought,
        totalSaved: purchaseSummary.totalSaved,
        discountedProducts: purchaseSummary.products,
        topVendors: vendorStats,
        topOrderedVendors: topOrderedVendors,
        topPurchasedProducts,
        shoppingStreak: streak,
        recommendedProducts,
        recommendedShops,
        orders,
        savedProducts,
        allProducts: products,
        moneySpent: moneySpentData.totalSpent,
        highestSpendingDay: moneySpentData.highestSpendingDay,
        dailySpending: moneySpentData.dailySpending,
        avgUserSpent: comparisonData.avgUserSpent,
        avgUserSaved: comparisonData.avgUserSaved,
        spentDiffPercentage: comparisonData.spentDiffPercentage,
        savedDiffPercentage: comparisonData.savedDiffPercentage,
        aboveAvgSpending: comparisonData.aboveAvgSpending,
        aboveAvgSaving: comparisonData.aboveAvgSaving,
        spendingMessage: comparisonData.spendingMessage,
        savingMessage: comparisonData.savingMessage,
        shoppingPersona, // Expose shopping persona state
    };
}

export function App() {
    const [page, setPage] = useState("home");
    const userData = useUserDataAggregate();

    // const { products } = usePopularProducts({
    //     fetchPolicy: "network-only",
    // });
    const { products: recentProducts } = useRecentProducts({
        fetchPolicy: "network-only",
    });
    const { orders } = useOrders({
        fetchPolicy: "network-only",
    });
    const buyerAttributesHook = useBuyerAttributes({
        fetchPolicy: "network-only",
    });
    const currentUser = useCurrentUser({
        fetchPolicy: "network-only",
    });
    const { products: savedProducts } = useSavedProducts({
        fetchPolicy: "network-only",
    });
    const { shops: followedShops } = useFollowedShops({
        fetchPolicy: "network-only",
    });
    const { shops: recentShops } = useRecentShops({
        fetchPolicy: "network-only",
    });
    console.log(currentUser);
    console.log(orders);
    console.log(recentProducts);
    console.log("Saved Products:", savedProducts);
    console.log("Followed Shops:", followedShops);
    console.log("Recent Shops:", recentShops);
    console.log("Buyer Attributes Hook:", buyerAttributesHook);

    if (page === "stories") {
        return <Stories />;
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-xl mx-auto px-4 py-6">
                {/* User Section */}
                <div className="mb-8 text-center">
                    <button
                        onClick={() => setPage("stories")}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        View Stories
                    </button>
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl font-semibold mx-auto mb-2 mt-4">
                        {"👤"}
                    </div>
                    <h2 className="text-xl font-bold">
                        {currentUser.currentUser
                            ? `Welcome, ${currentUser.currentUser.displayName}!`
                            : "Welcome to Shop Minis!"}
                    </h2>
                </div>
                {/* User Profile Section */}
                {currentUser.currentUser && (
                    <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4">
                            Your Profile
                        </h2>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                    Display Name:
                                </span>
                                <span className="font-medium">
                                    {currentUser.currentUser.displayName}
                                </span>
                            </div>
                            {/* Add other user properties here once they are available */}
                        </div>
                    </div>
                )}
                {/* Orders Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Your Orders</h2>
                    {orders?.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                            No orders found
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {orders?.map((order) => (
                                <div
                                    key={order.id}
                                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="w-full">
                                            <p className="font-medium">
                                                Order #{order.id}
                                            </p>
                                            {order.lineItems && (
                                                <div className="text-sm text-gray-700 mt-2">
                                                    <div className="space-y-1">
                                                        {order.lineItems.map(
                                                            (item) => (
                                                                <div
                                                                    key={
                                                                        item.productTitle
                                                                    }
                                                                    className="flex justify-between items-center py-1"
                                                                >
                                                                    <div className="flex-1">
                                                                        <span className="font-medium">
                                                                            {
                                                                                item.productTitle
                                                                            }
                                                                        </span>
                                                                        {item.variantTitle && (
                                                                            <span className="text-gray-500 ml-1">
                                                                                (
                                                                                {
                                                                                    item.variantTitle
                                                                                }

                                                                                )
                                                                            </span>
                                                                        )}
                                                                        <div className="text-gray-500">
                                                                            Quantity:{" "}
                                                                            {
                                                                                item.quantity
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                    {item.product && (
                                                                        <div className="ml-4 flex-shrink-0">
                                                                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                                                                                {item.productTitle.charAt(
                                                                                    0
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* User Data Summary Section */}
                <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">
                        Your Shopping Wrapped
                    </h2>

                    {/* Shopping Statistics */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                            <div className="text-3xl font-bold text-blue-600">
                                {userData.productsBought}
                            </div>
                            <div className="text-sm text-gray-600">
                                Products Purchased
                            </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                            <div className="text-3xl font-bold text-green-600">
                                ${userData.totalSaved}
                            </div>
                            <div className="text-sm text-gray-600">
                                Total Saved
                            </div>
                        </div>
                    </div>

                    {/* Shopping Streak */}
                    <div className="mb-6">
                        <div className="flex items-center mb-2">
                            <span className="text-lg font-semibold">
                                Shopping Streak
                            </span>
                            <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                                {userData.shoppingStreak} days
                            </span>
                        </div>
                        <div className="bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-yellow-400 h-full rounded-full"
                                style={{
                                    width: `${Math.min(
                                        userData.shoppingStreak * 10,
                                        100
                                    )}%`,
                                }}
                            ></div>
                        </div>
                    </div>

                    {/* Top Vendors */}
                    {userData.topVendors && userData.topVendors.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3">
                                Your Top Shops
                            </h3>
                            <div className="space-y-3">
                                {userData.topVendors
                                    .slice(0, 3)
                                    .map((vendor, index) => (
                                        <div
                                            key={vendor.vendor}
                                            className="flex items-center"
                                        >
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium">
                                                    {vendor.vendor}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    You're in the top{" "}
                                                    {vendor.topPercent}% of
                                                    shoppers
                                                </div>
                                            </div>
                                            <div className="text-lg font-semibold">
                                                {vendor.count}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Discounted Products */}
                    {userData.discountedProducts &&
                        userData.discountedProducts.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3">
                                    Your Best Deals
                                </h3>
                                <div className="space-y-3">
                                    {userData.discountedProducts
                                        .slice(0, 3)
                                        .map((product) => (
                                            <div
                                                key={product.name}
                                                className="p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="font-medium mb-1">
                                                    {product.name}
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">
                                                        Original: $
                                                        {product.originalPrice.toFixed(
                                                            2
                                                        )}
                                                    </span>
                                                    <span className="text-gray-500">
                                                        You paid: $
                                                        {product.discountedPrice.toFixed(
                                                            2
                                                        )}
                                                    </span>
                                                    <span className="text-green-600 font-medium">
                                                        Saved: $
                                                        {product.saved.toFixed(
                                                            2
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                </div>

                {/* Money Spent Section */}
                <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">
                        Your Spending Insights
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-sm text-gray-500">
                                    Total Spent
                                </div>
                                <div className="text-2xl font-bold text-green-600">
                                    ${userData.moneySpent}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500">
                                    Highest Spending Day
                                </div>
                                <div className="text-lg font-semibold">
                                    {userData.highestSpendingDay.date
                                        ? new Date(
                                              userData.highestSpendingDay.date
                                          ).toLocaleDateString()
                                        : "N/A"}
                                </div>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500">
                            Daily Spending Breakdown
                        </div>
                        <div className="space-y-2">
                            {userData.dailySpending.length === 0 ? (
                                <div className="text-gray-400 text-center py-2">
                                    No spending data available
                                </div>
                            ) : (
                                userData.dailySpending.map((entry) => (
                                    <div
                                        key={entry.date}
                                        className="flex justify-between"
                                    >
                                        <span className="text-gray-700">
                                            {new Date(
                                                entry.date
                                            ).toLocaleDateString()}
                                        </span>
                                        <span className="font-medium">
                                            ${entry.amount.toFixed(2)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Comparison with Average User Section */}
                <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">
                        Compare with Average User
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-sm text-gray-500">
                                    Average User Spent
                                </div>
                                <div className="text-2xl font-bold text-green-600">
                                    ${userData.avgUserSpent}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500">
                                    Your Spending Difference
                                </div>
                                <div
                                    className={`text-lg font-semibold ${
                                        userData.spentDiffPercentage > 0
                                            ? "text-red-600"
                                            : "text-green-600"
                                    }`}
                                >
                                    {userData.spentDiffPercentage > 0 && "+"}
                                    {userData.spentDiffPercentage}%
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-sm text-gray-500">
                                    Average User Saved
                                </div>
                                <div className="text-2xl font-bold text-green-600">
                                    ${userData.avgUserSaved}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500">
                                    Your Savings Difference
                                </div>
                                <div
                                    className={`text-lg font-semibold ${
                                        userData.savedDiffPercentage > 0
                                            ? "text-red-600"
                                            : "text-green-600"
                                    }`}
                                >
                                    {userData.savedDiffPercentage > 0 && "+"}
                                    {userData.savedDiffPercentage}%
                                </div>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500">
                            {userData.aboveAvgSpending
                                ? "You're above average in spending!"
                                : "You're below average in spending."}
                        </div>
                        <div className="text-sm text-gray-500">
                            {userData.aboveAvgSaving
                                ? "You're above average in savings!"
                                : "You're below average in savings."}
                        </div>
                    </div>
                </div>

                {/* Buyer Attributes Section */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">
                        Your Preferences
                    </h2>
                    {buyerAttributesHook.loading && (
                        <p>Loading preferences...</p>
                    )}
                    {buyerAttributesHook.error && (
                        <p className="text-red-500">
                            Error:{" "}
                            {buyerAttributesHook.error?.message ||
                                "Content not available"}
                        </p>
                    )}
                    {buyerAttributesHook.buyerAttributes &&
                    Object.keys(buyerAttributesHook.buyerAttributes).length >
                        0 ? (
                        <div className="space-y-2">
                            {Object.entries(
                                buyerAttributesHook.buyerAttributes
                            ).map(([key, value]) => {
                                if (
                                    key === "categoryAffinities" &&
                                    Array.isArray(value)
                                ) {
                                    const affinities = value
                                        .map(
                                            (affinity: any) =>
                                                affinity.name || "Unknown"
                                        )
                                        .join(", ");
                                    return (
                                        <div
                                            key={key}
                                            className="flex justify-between text-sm"
                                        >
                                            <span className="text-gray-600">
                                                Category Affinities:
                                            </span>
                                            <span className="font-medium">
                                                {affinities}
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={key}
                                        className="flex justify-between text-sm"
                                    >
                                        <span className="text-gray-600">
                                            {key
                                                .replace(/([A-Z])/g, " $1")
                                                .trim()}
                                            :
                                        </span>
                                        <span className="font-medium">
                                            {String(value)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        !buyerAttributesHook.loading &&
                        !buyerAttributesHook.error && (
                            <p>No preferences found.</p>
                        )
                    )}
                </div>
                {/**
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 *
                 */}
                {/* Recent Products Section
                {recentProducts && recentProducts.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">
                            Recently Viewed
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {recentProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                />
                            ))}
                        </div>
                    </div>
                )} */}
                {/* Popular Products Section
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                        Popular Products
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        {products?.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div> */}
                {/* Saved Products Section
                {savedProducts && savedProducts.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">
                            Saved Products
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {savedProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                />
                            ))}
                        </div>
                    </div>
                )} */}
                {/* Followed Shops Section
                {followedShops && followedShops.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">
                            Followed Shops
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {followedShops.map((shop) => (
                                <MerchantCard key={shop.id} shop={shop} />
                            ))}
                        </div>
                    </div>
                )} */}

                {/* Recent Shops Section
                {recentShops && recentShops.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">
                            Recent Shops
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {recentShops.map((shop) => (
                                <MerchantCard key={shop.id} shop={shop} />
                            ))}
                        </div>
                    </div>
                } */}
            </div>
        </main>
    );
}
