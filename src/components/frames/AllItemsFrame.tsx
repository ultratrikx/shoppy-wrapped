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
    emoji: string; // Fallback emoji
}

interface FlippedCard extends Card {
    index: number;
}

// Fallback emojis for different product types
const productEmojis = ["👕", "👟", "👜", "🧢", "👗", "🎒", "👔", "🧣"];

export const AllItemsFrame = ({ items }: AllItemsFrameProps) => {
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<FlippedCard[]>([]);
    const [isGameComplete, setIsGameComplete] = useState(false);
    const [matches, setMatches] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    
    // Storage for caching images
    const { getItem, setItem } = useAsyncStorage();
    
    // Only fetch media for selected items
    const { media: productMedia } = useProductMedia({
        id: selectedItemIds.join(","),
        skip: selectedItemIds.length === 0,
        first: 1
    });

    // Load image from cache or fetch it
    const getProductImage = useCallback(async (productId: string) => {
        try {
            // Try to get from cache first
            const cachedImage = await getItem({ key: `product_img_${productId}` });
            if (cachedImage) {
                return cachedImage;
            }
            
            // If not in cache, return null and let the product media hook handle it
            return null;
        } catch (error) {
            console.error("Error getting cached image:", error);
            return null;
        }
    }, [getItem]);

    // Save image to cache
    const cacheProductImage = useCallback(async (productId: string, imageUrl: string) => {
        try {
            await setItem({ key: `product_img_${productId}`, value: imageUrl });
        } catch (error) {
            console.error("Error caching image:", error);
        }
    }, [setItem]);
    
    // Select items for the game
    useEffect(() => {
        const selectGameItems = async () => {
            setIsLoading(true);
            
            // Get unique items and limit to 4
            const uniqueItems = Array.from(new Set(items.map(item => item.id)))
                .slice(0, 4);
            
            setSelectedItemIds(uniqueItems);
                
            // Create initial cards with emojis as fallbacks
            const initialCards = await Promise.all(
                uniqueItems.flatMap(async (id, index) => {
                    const item = items.find(i => i.id === id);
                    const emoji = productEmojis[index % productEmojis.length];
                    
                    // Try to get cached image
                    const cachedImage = await getProductImage(id);
                    
                    // Create two cards for each item (for matching)
                    return [0, 1].map(pairIndex => ({
                        id,
                        uniqueId: `${id}-${pairIndex}`,
                        title: item?.title || `Product ${index + 1}`,
                        image: cachedImage || undefined,
                        emoji,
                        isFlipped: false,
                        isMatched: false
                    }));
                })
            ).then(results => results.flat());
            
            // Shuffle the cards
            const shuffledCards = initialCards.sort(() => Math.random() - 0.5);
            setCards(shuffledCards);
            setIsLoading(false);
        };

        if (items.length > 0) {
            selectGameItems();
        }
    }, [items, getProductImage]);
    
    // Update cards with fetched images
    useEffect(() => {
        const updateCardsWithImages = async () => {
            if (!productMedia || productMedia.length === 0) return;
            
            let updatedCards = [...cards];
            let hasUpdates = false;
            
            // Process each media item
            for (const media of productMedia) {
                // Extract product ID from media
                const productId = media.id.split('/')[4];
                if (!productId) continue;
                
                // Extract image URL
                let imageUrl: string | undefined;
                if (media.mediaContentType === 'IMAGE' && media.image?.url) {
                    imageUrl = media.image.url;
                } else if (
                    (media.mediaContentType === 'VIDEO' || media.mediaContentType === 'MODEL_3D') && 
                    media.previewImage?.url
                ) {
                    imageUrl = media.previewImage.url;
                }
                
                if (!imageUrl) continue;
                
                // Cache the image
                await cacheProductImage(productId, imageUrl);
                
                // Update all cards with this product ID
                updatedCards = updatedCards.map(card => {
                    if (card.id === productId && !card.image) {
                        hasUpdates = true;
                        return { ...card, image: imageUrl };
                    }
                    return card;
                });
            }
            
            // Only update state if changes were made
            if (hasUpdates) {
                setCards(updatedCards);
            }
        };
        
        updateCardsWithImages();
    }, [productMedia, cards, cacheProductImage]);

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
                    updatedCards[firstCard.index].isMatched = true;
                    updatedCards[secondCard.index].isMatched = true;
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
                    updatedCards[firstCard.index].isFlipped = false;
                    updatedCards[secondCard.index].isFlipped = false;
                    setCards(updatedCards);
                    setFlippedCards([]);
                }, 1000);
            }
        }
    };

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
                                <div 
                                    className={`
                                        absolute inset-0 m-2 rounded-lg overflow-hidden
                                        flex items-center justify-center bg-white/10
                                        transition-all duration-300
                                        ${card.isFlipped || card.isMatched ? 'opacity-100' : 'opacity-0'}
                                    `}
                                >
                                    {card.image ? (
                                        <img 
                                            src={card.image} 
                                            alt={card.title}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                            onError={(e) => {
                                                // If image fails to load, show emoji fallback
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement!.innerHTML = `<div class="text-4xl">${card.emoji}</div>`;
                                            }}
                                        />
                                    ) : (
                                        <div className="text-4xl">{card.emoji}</div>
                                    )}
                                </div>
                                <div 
                                    className={`
                                        absolute inset-0 flex items-center justify-center
                                        text-3xl transition-all duration-300
                                        ${card.isFlipped || card.isMatched ? 'opacity-0' : 'opacity-100'}
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
