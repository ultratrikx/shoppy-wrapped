import { useState, useEffect, useCallback } from "react";
import { useProductMedia, useAsyncStorage } from "@shopify/shop-minis-react";
import { StoryFrameTemplate } from "../StoryFrameTemplate";

interface AllItemsFrameProps {
    items: Array<{
        id: string;
        title: string;
        quantity: number;
    }>;
}

const itemEmojis = [
    {
        emoji: "🛍️",
        top: "10%",
        left: "8%",
        size: "3.5rem",
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
        emoji: "🎁",
        bottom: "18%",
        left: "12%",
        size: "3.2rem",
        delay: "1s",
    },
];

interface Card {
    id: string;
    uniqueId: string;
    title: string;
    image?: string;
    isFlipped: boolean;
    isMatched: boolean;
}

interface FlippedCard extends Card {
    index: number;
}

export const AllItemsFrame = ({ items }: AllItemsFrameProps) => {
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<Array<Card & { index: number }>>([]);
    const [isGameComplete, setIsGameComplete] = useState(false);
    const [matches, setMatches] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [mediaLoaded, setMediaLoaded] = useState(false);
    
    // Extract only the IDs we need for the game (max 4 unique products)
    const uniqueProductIds = Array.from(new Set(items.map(item => item.id)))
        .slice(0, 4);
    
    // Get media specifically for the game products
    const { media: allProductMedia, loading: mediaLoading } = useProductMedia({
        id: uniqueProductIds.join(","),
        skip: uniqueProductIds.length === 0,
        first: 1,
    });
    
    // Storage for caching images
    const { getItem, setItem } = useAsyncStorage();
    
    // Cache the product image
    const cacheProductImage = useCallback(async (productId: string, imageUrl: string) => {
        try {
            await setItem({ key: `product_img_${productId}`, value: imageUrl });
            return imageUrl;
        } catch (error) {
            console.error("Error caching image:", error);
            return imageUrl;
        }
    }, [setItem]);

    // Get cached image
    const getCachedImage = useCallback(async (productId: string) => {
        try {
            return await getItem({ key: `product_img_${productId}` });
        } catch (error) {
            console.error("Error getting cached image:", error);
            return null;
        }
    }, [getItem]);

    // Extract image URL from media with improved matching logic
    const getImageFromMedia = useCallback((productId: string) => {
        if (!allProductMedia || !productId) return undefined;
        
        // Try to find matching media for this product
        const media = allProductMedia.find(m => {
            if (!m || !m.id) return false;
            
            // Extract product ID from Shopify media ID format
            // Example format: "gid://shopify/ProductImage/12345678901234567890"
            const idParts = m.id.split('/');
            
            // Get the last part (the numeric ID)
            const mediaIdPart = idParts[idParts.length - 1];
            
            // Sometimes the product ID is in the second-to-last position
            const mediaProductIdPart = idParts[idParts.length - 2];
            
            // Check various parts of the ID for a match
            return (
                mediaIdPart === productId || 
                mediaProductIdPart === productId ||
                m.id.includes(productId)
            );
        });
        
        if (!media) return undefined;
        
        // Extract the image URL depending on the media type
        if (media.mediaContentType === 'IMAGE' && media.image?.url) {
            return media.image.url;
        } else if (media.mediaContentType === 'MODEL_3D' && 'previewImage' in media && media.previewImage?.url) {
            return media.previewImage.url;
        } else if (media.mediaContentType === 'VIDEO' && 'previewImage' in media && media.previewImage?.url) {
            return media.previewImage.url;
        } else if (media.mediaContentType === 'EXTERNAL_VIDEO' && 'previewImage' in media && media.previewImage?.url) {
            return media.previewImage.url;
        }
        
        return undefined;
    }, [allProductMedia]);
    
    // Pre-process and store all available product images
    const [productImages, setProductImages] = useState<Record<string, string>>({});
    
    // Load all product images when media becomes available
    useEffect(() => {
        const loadProductImages = async () => {
            if (mediaLoading || !allProductMedia || allProductMedia.length === 0) return;
            
            console.log("Processing media for products:", uniqueProductIds);
            
            const imageMap: Record<string, string> = {};
            
            // Process each product ID to get its image
            for (const productId of uniqueProductIds) {
                // First try to get from cache
                let imageUrl = await getCachedImage(productId);                    // If not in cache, try to get from media
                    if (!imageUrl) {
                        const mediaUrl = getImageFromMedia(productId);
                        if (mediaUrl) {
                            imageUrl = mediaUrl;
                            
                            // Cache if found
                            await cacheProductImage(productId, mediaUrl);
                        }
                    }
                
                if (imageUrl) {
                    imageMap[productId] = imageUrl;
                    console.log(`Found image for product ${productId}: ${imageUrl}`);
                } else {
                    console.log(`No image found for product ${productId}`);
                }
            }
            
            setProductImages(imageMap);
            setMediaLoaded(true);
        };
        
        loadProductImages();
    }, [allProductMedia, mediaLoading, uniqueProductIds, getCachedImage, cacheProductImage, getImageFromMedia]);
    
    // Initialize game with available items
    useEffect(() => {
        const initializeGame = async () => {
            setIsLoading(true);
            
            // Wait a short time to ensure we don't block rendering
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Create cards with placeholders initially
            const initialCards = uniqueProductIds.flatMap(id => {
                const item = items.find(i => i.id === id);
                return [0, 1].map(pairIndex => ({
                    id,
                    uniqueId: `${id}-${pairIndex}`,
                    title: item?.title || "Product",
                    image: productImages[id], // Set image right away if available
                    isFlipped: false,
                    isMatched: false,
                }));
            });
            
            // Shuffle the cards
            const shuffledCards = initialCards.sort(() => Math.random() - 0.5);
            setCards(shuffledCards);
            
            // Mark as no longer loading
            setIsLoading(false);
        };

        // Only initialize game when products and media are ready
        if (items.length > 0 && mediaLoaded) {
            initializeGame();
        }
    }, [items, mediaLoaded, productImages, uniqueProductIds]);

    const handleCardClick = (clickedCard: Card, index: number) => {
        if (flippedCards.length === 2 || clickedCard.isMatched || clickedCard.isFlipped) {
            return;
        }

        // Flip the card
        const newCards = [...cards];
        newCards[index] = { ...clickedCard, isFlipped: true };
        setCards(newCards);

        const newFlippedCards = [...flippedCards, { ...clickedCard, index }];
        setFlippedCards(newFlippedCards);

        // Check for matches when we have 2 cards flipped
        if (newFlippedCards.length === 2) {
            const [firstCard, secondCard] = newFlippedCards;
            
            if (firstCard.id === secondCard.id) {
                // Match found
                setTimeout(() => {
                    const updatedCards = [...newCards];
                    // Update the cards at the stored indices
                    if ('index' in firstCard && 'index' in secondCard) {
                        updatedCards[firstCard.index].isMatched = true;
                        updatedCards[secondCard.index].isMatched = true;
                    }
                    setCards(updatedCards);
                    setFlippedCards([]);
                    setMatches(prev => {
                        const newMatches = prev + 1;
                        if (newMatches === cards.length / 2) {
                            setIsGameComplete(true);
                        }
                        return newMatches;
                    });
                }, 500);
            } else {
                // No match - flip cards back
                setTimeout(() => {
                    const updatedCards = [...newCards];
                    // Update the cards at the stored indices
                    if ('index' in firstCard && 'index' in secondCard) {
                        updatedCards[firstCard.index].isFlipped = false;
                        updatedCards[secondCard.index].isFlipped = false;
                    }
                    setCards(updatedCards);
                    setFlippedCards([]);
                }, 1000);
            }
        }
    };

    // Debugging information
    useEffect(() => {
        if (allProductMedia && allProductMedia.length > 0) {
            console.log("Media loaded:", allProductMedia.length, "items");
            console.log("Product IDs in game:", uniqueProductIds);
            
            allProductMedia.forEach(media => {
                if (!media || !media.id) return;
                
                const idParts = media.id.split('/');
                const mediaIdPart = idParts[idParts.length - 1];
                const mediaProductIdPart = idParts[idParts.length - 2];
                
                console.log(`Media ID: ${media.id}`);
                console.log(`Last part: ${mediaIdPart}, Second-to-last: ${mediaProductIdPart}`);
                
                if (media.mediaContentType === 'IMAGE' && media.image?.url) {
                    console.log(`Image URL: ${media.image.url}`);
                } else if (
                    (media.mediaContentType === 'MODEL_3D' || 
                     media.mediaContentType === 'VIDEO' || 
                     media.mediaContentType === 'EXTERNAL_VIDEO') && 
                    'previewImage' in media && 
                    media.previewImage?.url
                ) {
                    console.log(`Preview URL: ${media.previewImage.url}`);
                }
            });
        }
    }, [allProductMedia, uniqueProductIds]);

    return (
        <StoryFrameTemplate
            gradient="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700"
            emojis={itemEmojis}
        >
            <div className="flex flex-col items-center justify-center w-full h-full px-6">
                <div className="text-5xl mb-4">🛍️</div>
                <h2 className="text-2xl font-bold mb-2">Your Shopping Cart</h2>
                <p className="text-lg opacity-90 mb-6">Match your purchases!</p>

                {isLoading ? (
                    <div className="text-center">
                        <div className="inline-block animate-pulse text-4xl">⏳</div>
                        <p className="mt-2">Loading game...</p>
                    </div>
                ) : isGameComplete ? (
                    <div className="text-center space-y-4">
                        <div className="text-4xl">🎉</div>
                        <p className="text-xl font-bold">Great job!</p>
                        <p className="opacity-80">You matched all your purchases!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                        {cards.map((card, index) => (
                            <button
                                key={card.uniqueId}
                                onClick={() => handleCardClick(card, index)}
                                className={`
                                    relative aspect-square rounded-xl
                                    transition-all duration-300 transform
                                    ${card.isFlipped || card.isMatched 
                                        ? 'bg-white shadow-lg -translate-y-1' 
                                        : 'bg-white/20 hover:bg-white/30'
                                    }
                                    ${card.isMatched ? 'opacity-50' : ''}
                                `}
                                disabled={card.isMatched}
                            >
                                {/* Front of card (visible when flipped) */}
                                <div 
                                    className={`
                                        absolute inset-0 m-2 rounded-lg overflow-hidden
                                        flex items-center justify-center bg-white/10
                                        transition-all duration-300
                                        ${card.isFlipped || card.isMatched ? 'opacity-100 z-10' : 'opacity-0 z-0'}
                                    `}
                                >
                                    {card.image ? (
                                        <img 
                                            src={card.image}
                                            alt={card.title}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                            onError={(e) => {
                                                console.error(`Image failed to load for ${card.id}`);
                                                // Replace with emoji if image fails to load
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const parent = target.parentElement;
                                                if (parent) {
                                                    parent.innerHTML += '<div class="text-2xl">📦</div>';
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="text-2xl">📦</div>
                                    )}
                                </div>
                                
                                {/* Back of card (question mark) */}
                                <div 
                                    className={`
                                        absolute inset-0 flex items-center justify-center
                                        text-3xl transition-all duration-300
                                        ${card.isFlipped || card.isMatched ? 'opacity-0 z-0' : 'opacity-100 z-10'}
                                    `}
                                >
                                    ❔
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {!isLoading && !isGameComplete && (
                    <div className="mt-4 text-sm opacity-80">
                        Matches: {matches} / {cards.length / 2}
                    </div>
                )}
            </div>
        </StoryFrameTemplate>
    );
};
