"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, ChevronUp, Star } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/app/Component/CartContext"
import ReviewSection from "./ReviewSection"

interface Category {
    _id: string
    name: string
}

interface Product {
    _id: string
    name: string
    description: string
    price: number
    sizes: string[]
    categories: Category[]
    stock: number
    images: { public_id: string; url: string; _id: string; id: string }[]
    ratings: number
    numOfReviews: number
    slug: string
}

interface ApiResponse {
    success: boolean
    message: string
    data: Product
}

interface Review {
    _id: string
    user: {
        _id: string
        name: string
    }
    rating: number
    comment: string
    images: string[]
    createdAt: string
}

interface ReviewsResponse {
    success: boolean
    message: string
    data: {
        reviews: Review[]
        total: number
        pages: number
        page: number
    }
}

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://ecommercepeachflask-git-main-husnain-alis-projects-dbd16c4d.vercel.app"

export default function ProductPage() {
    const params = useParams()
    const { id } = params

    const [product, setProduct] = useState<Product | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [reviews, setReviews] = useState<Review[]>([])
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
    const [showFullDescription, setShowFullDescription] = useState(false)
    const { cart, addToCart } = useCart()
    const { toast } = useToast()

    const fetchRelatedProducts = useCallback(
        async (categories: Category[]) => {
            try {
                const categoryIds = categories.map((cat) => cat._id).join(",")
                const res = await fetch(`${API_URL}/api/products/by-categories?categories=${categoryIds}`)
                if (!res.ok) {
                    toast({
                        title: "Error",
                        description: "Failed to fetch related products",
                        variant: "destructive",
                    })
                }
                const data = await res.json()
                if (!data.success) {
                    toast({
                        title: "Error",
                        description: "Failed to fetch related products",
                        variant: "destructive",
                    })
                }
                // Store all products except current one
                const filteredProducts = data.data.filter((p: Product) => p._id !== id)
                setRelatedProducts(filteredProducts)
            } catch (err: unknown) {
                toast({
                    title: "Error",
                    description: "Error fetching related products: " + (err instanceof Error ? err.message : "Unknown error"),
                    variant: "destructive",
                })
            }
        },
        [id, toast],
    )

    useEffect(() => {
        if (!id) return

        const fetchProductAndReviews = async () => {
            try {
                const [productRes, reviewsRes] = await Promise.all([
                    fetch(`${API_URL}/api/products/${id}`),
                    fetch(`${API_URL}/api/reviews/${id}`),
                ])

                if (!productRes.ok || !reviewsRes.ok) {
                    toast({
                        title: "Error",
                        description: "Failed to fetch product or reviews",
                        variant: "destructive",
                    })
                }

                const productData: ApiResponse = await productRes.json()
                const reviewsData: ReviewsResponse = await reviewsRes.json()

                if (!productData.success || !reviewsData.success) {
                    toast({
                        title: "Error",
                        description: "Failed to fetch product or reviews" + productData.message || reviewsData.message,
                        variant: "destructive",
                    })
                }

                setProduct(productData.data)
                setSelectedImage(productData.data.images[0]?.url || null)
                setReviews(reviewsData.data.reviews)
                await fetchRelatedProducts(productData.data.categories)
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setIsLoading(false)
            }
        }

        fetchProductAndReviews()
    }, [id, fetchRelatedProducts, toast])

    const handleImageClick = (url: string) => {
        setSelectedImage(url)
    }

    const handleAddToCart = () => {
        if (!product) return

        const currentCartItem = cart.find((item) => item.id === product._id)
        const currentQuantity = currentCartItem?.quantity || 0

        if (currentQuantity >= product.stock) {
            toast({
                title: "Error",
                description: `Cannot add more items. Maximum stock (${product.stock}) reached.`,
                variant: "destructive",
            })
            return
        }

        addToCart({
            id: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.images[0]?.url || "",
            stock: product.stock,
        })

        toast({
            title: "Success",
            description: "Added to cart successfully",
        })
    }

    if (isLoading) {
        return <LoadingState />
    }

    if (error || !product) {
        return <ErrorState error={error} />
    }

    // Truncate description for initial view
    const truncatedDescription =
        product.description.length > 150 ? `${product.description.substring(0, 150)}...` : product.description

    return (
        <div className="container mx-auto px-4 py-8 w-full">
            {/* Main product section - Image left, details right */}
            <div className="grid md:grid-cols-2 gap-8 mb-12 w-full">
                {/* Left side - Product images */}
                <div className="space-y-5 w-[1/3]">
                    <div className="aspect-[16/10] rounded-lg overflow-hidden border">
                        <Image
                            src={selectedImage || "/placeholder.svg"}
                            alt={product.name}
                            width={600}
                            height={600}
                            className="object-cover w-full h-full"
                        />
                    </div>
                    <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
                        {product.images.map((image) => (
                            <div
                                key={image.id}
                                className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 cursor-pointer transition-all ${selectedImage === image.url ? "border-primary" : "border-gray-200"
                                    }`}
                                onClick={() => handleImageClick(image.url)}
                            >
                                <Image
                                    src={image.url || "/placeholder.svg"}
                                    alt={product.name}
                                    width={80}
                                    height={80}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right side - Product details */}
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold">{product.name}</h1>

                    {/* Rating display */}
                    <div className="flex items-center">
                        <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-5 h-5 ${star <=
                                            (reviews.length > 0 ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length : 0)
                                            ? "text-yellow-400 fill-current"
                                            : "text-gray-300"
                                        }`}
                                />
                            ))}
                        </div>
                        <span className="ml-2 text-gray-600">
                            {reviews.length > 0
                                ? `${(reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)} out of 5 (${reviews.length} reviews)`
                                : "No reviews yet"}
                        </span>
                    </div>

                    <div className="text-2xl font-semibold">Rs {product.price.toFixed(2)}</div>

                    {/* Sizes */}
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Sizes:</h2>
                        <div className="flex flex-wrap gap-2">
                            {product.sizes.map((size) => (
                                <span key={size} className="px-3 py-1 border rounded-full text-sm">
                                    {size}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Categories */}
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Categories:</h2>
                        <div className="flex flex-wrap gap-2">
                            {product.categories.map((category) => (
                                <span key={category._id} className="px-3 py-1 bg-gray-200 rounded-full text-sm">
                                    {category.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Stock information */}
                    {product.stock > 0 && (
                        <p className="text-sm text-gray-600">
                            {product.stock <= 5 ? `Only ${product.stock} left in stock - order soon` : "In stock"}
                        </p>
                    )}
                    
                    {/* Add to cart button */}
                    <button
                        onClick={handleAddToCart}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        disabled={product.stock === 0}
                    >
                        {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                    </button>

                    
                </div>
            </div>

            {/* Description section */}
            <div className="mb-12">
                <h2 className="text-2xl font-bold mb-4">Product Description</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{showFullDescription ? product.description : truncatedDescription}</p>
                    {product.description.length > 150 && (
                        <button
                            onClick={() => setShowFullDescription(!showFullDescription)}
                            className="text-blue-600 font-medium mt-2 flex items-center"
                        >
                            {showFullDescription ? (
                                <>
                                    Show less <ChevronUp className="ml-1 w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    Read more <ChevronDown className="ml-1 w-4 h-4" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Reviews section */}
            <div className="mb-12">
                <ReviewSection reviews={reviews} />
            </div>

            {/* Related products section */}
            <div className="mb-12">
                <RelatedProducts products={relatedProducts} />
            </div>

            {/* FAQ section */}
            <div className="mb-12">
                <FAQ />
            </div>

            {/* Recent products section */}
            <div>
                <RecentProducts currentProductId={product._id} />
            </div>
        </div>
    )
}

function LoadingState() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="aspect-square bg-gray-300 rounded-lg"></div>
                        <div className="flex gap-2">
                            <div className="w-20 h-20 bg-gray-300 rounded-md"></div>
                            <div className="w-20 h-20 bg-gray-300 rounded-md"></div>
                            <div className="w-20 h-20 bg-gray-300 rounded-md"></div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                        <div className="flex">
                            <div className="h-5 w-24 bg-gray-300 rounded"></div>
                        </div>
                        <div className="h-8 bg-gray-300 rounded w-1/4"></div>
                        <div className="space-y-2">
                            <div className="h-6 bg-gray-300 rounded w-1/4"></div>
                            <div className="flex space-x-2">
                                <div className="h-8 w-16 bg-gray-300 rounded-full"></div>
                                <div className="h-8 w-16 bg-gray-300 rounded-full"></div>
                                <div className="h-8 w-16 bg-gray-300 rounded-full"></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-6 bg-gray-300 rounded w-1/4"></div>
                            <div className="flex space-x-2">
                                <div className="h-8 w-24 bg-gray-300 rounded-full"></div>
                                <div className="h-8 w-24 bg-gray-300 rounded-full"></div>
                            </div>
                        </div>
                        <div className="h-12 bg-gray-300 rounded w-full"></div>
                    </div>
                </div>
                <div className="mt-12 space-y-4">
                    <div className="h-8 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-24 bg-gray-300 rounded"></div>
                </div>
            </div>
        </div>
    )
}

function ErrorState({ error }: { error: string | null }) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-4xl font-bold mb-4">Error</h1>
            <p className="text-xl mb-8">{error || "An error occurred while fetching the product."}</p>
            <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Go back to Home
            </Link>
        </div>
    )
}

function RecentProducts({ currentProductId }: { currentProductId: string }) {
    const [recentProducts, setRecentProducts] = useState<Product[]>([])
    const { toast } = useToast()

    useEffect(() => {
        const fetchRecentProducts = async () => {
            try {
                const res = await fetch(`${API_URL}/api/products/recent`)
                if (!res.ok) {
                    toast({
                        title: "Error",
                        description: "Failed to fetch recent products",
                        variant: "destructive",
                    })
                }
                const data = await res.json()
                if (!data.success) {
                    toast({
                        title: "Error",
                        description: "Failed to fetch recent products",
                        variant: "destructive",
                    })
                }
                setRecentProducts(data.data.filter((product: Product) => product._id !== currentProductId).slice(0, 4))
            } catch (err) {
                toast({
                    title: "Error",
                    description: "Error fetching recent products: " + (err instanceof Error ? err.message : "Unknown error"),
                    variant: "destructive",
                })
            }
        }

        fetchRecentProducts()
    }, [currentProductId, toast])

    if (recentProducts.length === 0) {
        return null
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Recently Viewed Products</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {recentProducts.map((product) => (
                    <Link href={`/user/productDetail/${product._id}`} key={product._id}>
                        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow h-full">
                            <div className="relative aspect-square">
                                <Image
                                    src={product.images[0]?.url || "/placeholder.svg"}
                                    alt={product.name}
                                    fill
                                    className="object-cover rounded-t-lg"
                                />
                            </div>
                            <div className="p-3">
                                <h3 className="font-medium text-sm sm:text-base truncate">{product.name}</h3>
                                <p className="text-sm font-semibold text-gray-900 mt-1">Rs {product.price.toFixed(2)}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}

function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    const toggleQuestion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index)
    }

    const faqs = [
        {
            question: "What materials are your water bottles made from?",
            answer:
                "Our water bottles are made from high-quality, BPA-free materials such as stainless steel, glass, and durable plastics. Each product description specifies the exact material used.",
        },
        {
            question: "Are your water bottles dishwasher safe?",
            answer:
                "Most of our water bottles are dishwasher safe, but we recommend checking the care instructions for each specific product. Some bottles with special coatings or insulation may require hand washing.",
        },
        {
            question: "How long do your insulated bottles keep drinks cold or hot?",
            answer:
                "Our insulated bottles typically keep drinks cold for up to 24 hours and hot for up to 12 hours. However, this can vary depending on the specific model and environmental conditions.",
        },
        {
            question: "Do you offer a warranty on your water bottles?",
            answer:
                "Yes, we offer a limited warranty on manufacturing defects for all our water bottles. The duration of the warranty varies by product, so please check the product details or contact our customer service for specific information.",
        },
        {
            question: "How do I clean my water bottle?",
            answer:
                "For regular cleaning, use warm soapy water and a bottle brush. For deep cleaning, you can use a mixture of vinegar and water or denture tablets. Always rinse thoroughly after cleaning. For specific care instructions, refer to the product manual.",
        },
    ]

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                        <button
                            className="flex justify-between items-center w-full p-4 text-left font-medium hover:bg-gray-50 transition-colors"
                            onClick={() => toggleQuestion(index)}
                        >
                            <span>{faq.question}</span>
                            {openIndex === index ? (
                                <ChevronUp className="flex-shrink-0" />
                            ) : (
                                <ChevronDown className="flex-shrink-0" />
                            )}
                        </button>
                        {openIndex === index && (
                            <div className="p-4 bg-gray-50 border-t">
                                <p className="text-gray-700">{faq.answer}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

function RelatedProducts({ products }: { products: Product[] }) {
    const uniqueProducts = Array.from(new Map(products.map((item) => [item._id, item])).values()).slice(0, 4)

    if (uniqueProducts.length === 0) {
        return null
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Related Products</h2>
            <p className="text-gray-600 mb-6">You might also like these products</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {uniqueProducts.map((product) => (
                    <Link href={`/user/productDetail/${product._id}`} key={product._id} className="group shadow-lg">
                        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow h-full">
                            <div className="relative aspect-[14/9] overflow-hidden rounded-t-lg">
                                <Image
                                    src={product.images[0]?.url || "/placeholder.svg"}
                                    alt={product.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {product.stock <= 0 && (
                                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                        Out of Stock
                                    </div>
                                )}
                                {product.stock > 0 && product.stock <= 5 && (
                                    <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                        Low Stock
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <h3 className="font-medium text-sm sm:text-base ">{product.name}</h3>
                                {/* <div className="flex items-center justify-between mt-2">
                                    <p className="text-sm font-semibold text-gray-900">Rs {product.price.toLocaleString()}</p>
                                    {product.stock > 0 && <span className="text-xs text-gray-500">{product.stock} left</span>}
                                </div> */}
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {product.sizes.slice(0, 2).map((size) => (
                                        <span
                                            key={size}
                                            className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded"
                                        >
                                            {size}
                                        </span>
                                    ))}
                                    {product.sizes.length > 2 && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                                            +{product.sizes.length - 2}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}

