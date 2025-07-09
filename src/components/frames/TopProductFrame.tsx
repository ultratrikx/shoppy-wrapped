import { useProductMedia } from "@shopify/shop-minis-react";
import { StoryFrameTemplate } from "../StoryFrameTemplate";

interface TopProductFrameProps {
    product?: string;
    productId?: string;
}

const productEmojis = [
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
];

export const TopProductFrame = ({
    product,
    productId,
}: TopProductFrameProps) => {
    const { media } = useProductMedia({
        id: productId || "",
        skip: !productId,
        first: 1,
    });

    const firstMedia = media?.[0];
    let productImage: string | undefined;

    if (firstMedia) {
        if (firstMedia.mediaContentType === "IMAGE") {
            productImage = firstMedia.image?.url;
        } else if (firstMedia.mediaContentType === "VIDEO") {
            productImage = firstMedia.previewImage?.url;
        } else if (firstMedia.previewImage) {
            productImage = firstMedia.previewImage.url;
        }
    }

    return (
        <StoryFrameTemplate
            gradient="bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700"
            emojis={productEmojis}
        >
            {/* Background falling products */}
            {productImage && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    {Array.from({ length: 24 }, (_, i) => {
                        const size = 32 + Math.random() * 16; // Random size between 32px and 48px
                        return (
                            <img
                                key={i}
                                src={productImage}
                                alt=""
                                className="animate-rainfall object-cover rounded-lg opacity-30 absolute"
                                style={{
                                    width: `${size}px`,
                                    height: `${size}px`,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * -100}%`,
                                    animationDelay: `${Math.random() * 8}s`,
                                    animationDuration: `${6 + Math.random() * 4}s`,
                                    transform: `rotate(${Math.random() * 30 - 15}deg)`,
                                }}
                            />
                        );
                    })}
                </div>
            )}

            {/* Main content */}
            <div className="flex flex-col items-center justify-center w-full h-full relative px-6">
                <div className="flex flex-col items-center space-y-6 relative z-10">
                    <div className="text-5xl">🌟</div>

                    {productImage && (
                        <div className="relative w-48 h-48 overflow-hidden rounded-2xl shadow-xl ring-4 ring-white/20">
                            <img
                                src={productImage}
                                alt={product || "Top product"}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="text-center space-y-3 max-w-[280px]">
                        <h2 className="text-2xl font-light opacity-90">
                            Your top product
                        </h2>
                        {product && (
                            <p className="text-3xl font-bold">{product}</p>
                        )}
                    </div>
                </div>
            </div>
        </StoryFrameTemplate>
    );
};
