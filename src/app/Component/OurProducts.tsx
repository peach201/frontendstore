"use client"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.peachflask.com"

interface Product {
    _id: string
    name: string
    description: string
    price: number
    stock: number
    sizes: string[]
    categories: string[]
    images: { public_id: string; url: string }[]
    slug: string
    ratings: number
    numOfReviews: number
}

export default function ProductGrid() {
    const [products, setProducts] = useState<Product[]>([])
    const [visibleProducts, setVisibleProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const productsPerLoad = 4

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`${API_URL}/api/products`, {
                credentials: "include",
            })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch products")
            }

            setProducts(data.data.products)
            setVisibleProducts(data.data.products.slice(0, productsPerLoad))
        } catch (error) {
            console.error("Error fetching products:", error)
            setError(error instanceof Error ? error.message : "An unknown error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    const loadMoreProducts = () => {
        const currentLength = visibleProducts.length
        const newProducts = products.slice(currentLength, currentLength + productsPerLoad)
        setVisibleProducts([...visibleProducts, ...newProducts])
    }

    if (isLoading) {
        return <LoadingState />
    }

    if (error) {
        return <div className="text-center text-red-500">{error}</div>
    }

    if (products.length === 0) {
        return <NoProducts />
    }

    return (
        <main className="flex flex-col items-center justify-between px-4">
            <div className="pb-10 w-full max-w-7xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {visibleProducts.map((product) => (
                        <Link key={product._id} href={`/user/productDetail/${product._id}`} className="block h-full">
                            <Card className="bg-white overflow-hidden flex flex-col h-full shadow-md hover:shadow-xl transition-shadow duration-300">
                                <CardHeader className="p-0">
                                    <div className="relative aspect-square">
                                        <Image
                                            src={product.images[0]?.url || "/placeholder.svg"}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                        />
                                    </div>
                                </CardHeader>
                                <div className="flex flex-col w-full">
                                    <CardContent className="flex-1 px-4 py-3">
                                        <h3 className="font-medium text-gray-900 hover:text-gray-600 transition-colors line-clamp-2">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            <span className="text-sm font-medium">{product.ratings}</span>
                                            {product.numOfReviews > 0 && (
                                                <span className="text-sm text-gray-500">({product.numOfReviews})</span>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="px-4 pb-3 pt-0">
                                        <span className="text-md font-semibold text-red-500">Rs {product.price.toFixed(2)}</span>
                                    </CardFooter>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
                {visibleProducts.length < products.length && (
                    <div className="mt-8 text-center">
                        <Button
                            className="hover:bg-[#9ACA3C] bg-[#3A3A3A] transition-colors duration-300"
                            onClick={loadMoreProducts}
                        >
                            Load More
                        </Button>
                    </div>
                )}
            </div>
        </main>
    )
}

function LoadingState() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
                <div className="flex justify-between items-center mb-8">
                    <div className="h-8 bg-gray-300 rounded w-1/4"></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="bg-white overflow-hidden flex flex-col p-4 rounded-lg shadow-sm">
                            <div className="aspect-square bg-gray-300 rounded-lg mb-4"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-300 rounded w-full"></div>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                                <div className="h-6 bg-gray-300 rounded w-1/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function NoProducts() {
    return (
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
            >
                <h2 className="text-2xl font-bold mb-4">No Products Available</h2>
                <p className="text-gray-600 mb-8">Check back later for more products!</p>
                <motion.div
                    initial={{ y: -10 }}
                    animate={{ y: 10 }}
                    transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        duration: 1,
                    }}
                >
                    <Image src="/noproduct.svg" alt="No Products" height={100} width={100} className="w-64 h-64 mx-auto" />
                </motion.div>
            </motion.div>
        </div>
    )
}

