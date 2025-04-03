"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, ChevronUp, Star, Share2, ShoppingCart, Truck, Shield, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/app/Component/CartContext"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
                        duration: 1000,
                    })
                }
                const data = await res.json()
                if (!data.success) {
                    toast({
                        title: "Error",
                        description: "Failed to fetch related products",
                        variant: "destructive",
                        duration: 1000,
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
                    duration: 1000,
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
                        duration: 1000,
                    })
                }

                const productData: ApiResponse = await productRes.json()
                const reviewsData: ReviewsResponse = await reviewsRes.json()

                if (!productData.success || !reviewsData.success) {
                    toast({
                        title: "Error",
                        description: "Failed to fetch product or reviews" + productData.message || reviewsData.message,
                        variant: "destructive",
                        duration: 1000,
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
                description: `Cannot add more items. Maximum stock reached.`,
                variant: "destructive",
                duration: 1000,
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
            duration: 1000,
        })
    }

    const handleBuyNow = () => {
        handleAddToCart()
        // Navigate to checkout page
        window.location.href = "/user/cart"
    }

    const handleShareClick = () => {
        const url = window.location.href
        navigator.clipboard
            .writeText(url)
            .then(() => {
                toast({
                    title: "Link Copied",
                    description: "Product link copied to clipboard",
                    duration: 1000,
                })
            })
            .catch(() => {
                toast({
                    title: "Error",
                    description: "Failed to copy link",
                    variant: "destructive",
                    duration: 1000,
                })
            })
    }

    if (isLoading) {
        return <LoadingState />
    }

    if (error || !product) {
        return <ErrorState error={error} />
    }

    // Calculate average rating
    const averageRating =
        reviews.length > 0 ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length : 0

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
          

            {/* Main product section */}
            <div className="container mx-auto px-4">
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left side - Product images */}
                        <div className="flex flex-col">
                            <div className="relative bg-white border rounded-lg mb-4 flex items-center justify-center h-[400px]">
                                {product.stock <= 0 && (
                                    <div className="absolute top-4 left-4 z-10">
                                        <Badge variant="destructive">Out of Stock</Badge>
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 z-10 flex space-x-2">
                                    
                                    <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100" onClick={handleShareClick}>
                                        <Share2 className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                                <Image
                                    src={selectedImage || "/placeholder.svg"}
                                    alt={product.name}
                                    width={350}
                                    height={350}
                                    className="object-contain max-h-[350px] max-w-full"
                                />
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                                {product.images.map((image) => (
                                    <button
                                        key={image.id}
                                        className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${selectedImage === image.url ? "border-orange-500" : "border-gray-200"
                                            }`}
                                        onClick={() => handleImageClick(image.url)}
                                    >
                                        <Image
                                            src={image.url || "/placeholder.svg"}
                                            alt={product.name}
                                            width={64}
                                            height={64}
                                            className="object-cover w-full h-full"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right side - Product details */}
                        <div className="space-y-4">
                            <div>
                                <h1 className="text-xl md:text-2xl font-medium text-gray-800 mb-2">{product.name}</h1>

                                {/* Brand & Rating */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        {averageRating > 0 ? (
                                            <>
                                                <div className="flex items-center">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`w-4 h-4 ${star <= Math.round(averageRating) ? "text-yellow-400 fill-current" : "text-gray-300"
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="ml-2 text-sm text-gray-600">
                                                    {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-sm text-gray-500">No reviews yet</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Price */}
                            <div>
                                <div className="flex items-baseline">
                                    <span className="text-3xl font-bold text-orange-500">Rs. {product.price.toLocaleString()}</span>
                                    <span className="ml-2 text-sm text-gray-500">Tax included</span>
                                </div>

                                {product.stock > 0 ? (
                                    <div className="flex items-center mt-1 text-sm text-green-600">
                                        <span className="inline-block w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                                        In Stock
                                    </div>
                                ) : (
                                    <div className="flex items-center mt-1 text-sm text-red-600">
                                        <span className="inline-block w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                                        Out of Stock
                                    </div>
                                )}
                            </div>

                            {/* Sizes */}
                            {product.sizes && product.sizes.length > 0 && (
                                <div>
                                    <div className="flex items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Available Sizes</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {product.sizes.map((size) => (
                                            <div key={size} className="px-3 py-1 border rounded-md text-sm border-gray-300 text-gray-700">
                                                {size}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Button
                                    onClick={handleBuyNow}
                                    disabled={product.stock === 0}
                                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3"
                                >
                                    Buy Now
                                </Button>
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                    variant="outline"
                                    className="flex-1 border-orange-500 text-orange-500 hover:bg-orange-50 font-medium py-3"
                                >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Add to Cart
                                </Button>
                            </div>

                            {/* Delivery info */}
                            <div className="bg-gray-50 p-4 rounded-lg mt-6">
                                <div className="flex items-start mb-3">
                                    <Truck className="w-5 h-5 text-gray-600 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Standard Delivery</p>
                                        <p className="text-xs text-gray-500">2-5 business days</p>
                                    </div>
                                </div>
                                <div className="flex items-start mb-3">
                                    <Shield className="w-5 h-5 text-gray-600 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Warranty</p>
                                        <p className="text-xs text-gray-500">7 days warranty</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <Clock className="w-5 h-5 text-gray-600 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Return Policy</p>
                                        <p className="text-xs text-gray-500">Easy 7 days return</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product description */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                    <h2 className="text-xl font-medium text-gray-800 mb-4">Product Description</h2>
                    <div className="prose max-w-none">
                        <p className="text-gray-700 whitespace-pre-line">
                            {showFullDescription
                                ? product.description
                                : product.description.length > 300
                                    ? product.description.substring(0, 300) + "..."
                                    : product.description}
                        </p>
                        {product.description.length > 300 && (
                            <button
                                onClick={() => setShowFullDescription(!showFullDescription)}
                                className="text-orange-500 font-medium mt-2 flex items-center"
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

                {/* Product specifications */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                    <h2 className="text-xl font-medium text-gray-800 mb-4">Specifications</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium text-gray-800 mb-2">Product Details</h3>
                                <ul className="space-y-2">
                                    <li className="flex">
                                        <span className="text-gray-600 w-1/3">Name:</span>
                                        <span className="text-gray-800 w-2/3">{product.name}</span>
                                    </li>
                                    {product.sizes && product.sizes.length > 0 && (
                                        <li className="flex">
                                            <span className="text-gray-600 w-1/3">Available Sizes:</span>
                                            <span className="text-gray-800 w-2/3">{product.sizes.join(", ")}</span>
                                        </li>
                                    )}
                                    <li className="flex">
                                        <span className="text-gray-600 w-1/3">Stock Status:</span>
                                        <span className={`w-2/3 ${product.stock > 0 ? "text-green-600" : "text-red-600"}`}>
                                            {product.stock > 0 ? "In Stock" : "Out of Stock"}
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium text-gray-800 mb-2">Categories</h3>
                                <div className="flex flex-wrap gap-2">
                                    {product.categories.map((category) => (
                                        <Link
                                            key={category._id}
                                            href={`/category/${category._id}`}
                                            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-full text-sm text-gray-700"
                                        >
                                            {category.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews section */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                    <h2 className="text-xl font-medium text-gray-800 mb-4">Ratings & Reviews</h2>
                    <ReviewSection reviews={reviews} />
                </div>

                {/* Related products */}
                {relatedProducts.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                        <h2 className="text-xl font-medium text-gray-800 mb-4">Similar Products</h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {relatedProducts.slice(0, 5).map((product) => (
                                <Link href={`/user/productDetail/${product._id}`} key={product._id} className="group">
                                    <div className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow h-full">
                                        <div className="relative aspect-square overflow-hidden">
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
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-medium text-sm line-clamp-2 h-10">{product.name}</h3>
                                            <p className="text-orange-500 font-semibold mt-1">Rs. {product.price.toLocaleString()}</p>
                                            {product.ratings > 0 && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                    <span className="text-xs font-medium">{product.ratings}</span>
                                                    {product.numOfReviews > 0 && (
                                                        <span className="text-xs text-gray-500">({product.numOfReviews})</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* FAQ section */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                    <FAQ />
                </div>

                {/* Recently viewed */}
                <RecentProducts currentProductId={product._id} />
            </div>
        </div>
    )
}

function LoadingState() {
    return (
        <div className="container mx-auto px-4 py-8 bg-gray-50">
            <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="aspect-square bg-gray-200 rounded-lg"></div>
                        <div className="flex gap-2">
                            <div className="w-16 h-16 bg-gray-200 rounded-md"></div>
                            <div className="w-16 h-16 bg-gray-200 rounded-md"></div>
                            <div className="w-16 h-16 bg-gray-200 rounded-md"></div>
                            <div className="w-16 h-16 bg-gray-200 rounded-md"></div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                        <div className="flex">
                            <div className="h-5 w-24 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        <div className="space-y-2">
                            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                            <div className="flex space-x-2">
                                <div className="h-8 w-16 bg-gray-200 rounded-full"></div>
                                <div className="h-8 w-16 bg-gray-200 rounded-full"></div>
                                <div className="h-8 w-16 bg-gray-200 rounded-full"></div>
                            </div>
                        </div>
                        <div className="flex space-x-4">
                            <div className="h-12 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-12 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ErrorState({ error }: { error: string | null }) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
                <h1 className="text-2xl font-bold mb-4 text-gray-800">Product Not Found</h1>
                <p className="text-gray-600 mb-8">{error || "We couldn't find the product you're looking for."}</p>
                <Link
                    href="/user/allProduct"
                    className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                    Browse All Products
                </Link>
            </div>
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
                        duration: 1000,
                    })
                }
                const data = await res.json()
                if (!data.success) {
                    toast({
                        title: "Error",
                        description: "Failed to fetch recent products",
                        variant: "destructive",
                        duration: 1000,
                    })
                }
                setRecentProducts(data.data.filter((product: Product) => product._id !== currentProductId).slice(0, 5))
            } catch (err) {
                toast({
                    title: "Error",
                    description: "Error fetching recent products: " + (err instanceof Error ? err.message : "Unknown error"),
                    variant: "destructive",
                    duration: 1000,
                })
            }
        }

        fetchRecentProducts()
    }, [currentProductId, toast])

    if (recentProducts.length === 0) {
        return null
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Recently Viewed</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recentProducts.map((product) => (
                    <Link href={`/user/productDetail/${product._id}`} key={product._id} className="group">
                        <div className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow h-full">
                            <div className="relative aspect-square overflow-hidden">
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
                            </div>
                            <div className="p-3">
                                <h3 className="font-medium text-sm line-clamp-2 h-10">{product.name}</h3>
                                <p className="text-orange-500 font-semibold mt-1">Rs. {product.price.toLocaleString()}</p>
                                {product.ratings > 0 && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        <span className="text-xs font-medium">{product.ratings}</span>
                                        {product.numOfReviews > 0 && (
                                            <span className="text-xs text-gray-500">({product.numOfReviews})</span>
                                        )}
                                    </div>
                                )}
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
            <h2 className="text-xl font-medium text-gray-800 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                        <button
                            className="flex justify-between items-center w-full p-4 text-left font-medium hover:bg-gray-50 transition-colors"
                            onClick={() => toggleQuestion(index)}
                        >
                            <span>{faq.question}</span>
                            {openIndex === index ? (
                                <ChevronUp className="flex-shrink-0 w-5 h-5 text-gray-500" />
                            ) : (
                                <ChevronDown className="flex-shrink-0 w-5 h-5 text-gray-500" />
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

