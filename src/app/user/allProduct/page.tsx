"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { Grid, List, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { useDebounce } from "@/hooks/useDebounce"

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://ecommercepeachflask-git-main-husnain-alis-projects-dbd16c4d.vercel.app"

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

interface Category {
    _id: string
    name: string
}

const sortOptions = [
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "name_asc", label: "Name: A to Z" },
    { value: "name_desc", label: "Name: Z to A" },
]

export default function AllProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [availableSizes, setAvailableSizes] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [selectedSizes, setSelectedSizes] = useState<string[]>([])
    const [priceRange, setPriceRange] = useState([0, 1000000])
    const [sortBy, setSortBy] = useState("price_asc")
    const [currentPage, setCurrentPage] = useState(1)
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const productsPerPage = 12
    const { toast } = useToast()

    const debouncedSearchTerm = useDebounce(searchTerm, 300)

    const fetchCategories = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/categories`, {
                credentials: "include",
            })
            const data = await response.json()

            if (!response.ok) {
                toast({
                    title: "Error",
                    description: "Failed to fetch categories" + data.message,
                    variant: "destructive",
                    duration: 1000,
                })
            }

            setCategories(data)
        } catch (error) {
            setError(error instanceof Error ? error.message : "An unknown error occurred")
            toast({
                title: "Error",
                description: "Error fetching categories:" + (error instanceof Error ? error.message : String(error)),
                variant: "destructive",
                duration: 1000,
            })
        }
    }, [toast])

    const fetchSizes = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/products/sizes/all`, {
                credentials: "include",
            })
            const data = await response.json()

            if (!response.ok) {
                toast({
                    title: "Error",
                    description: "Failed to fetch sizes" + data.message,
                    variant: "destructive",
                    duration: 1000,
                })
                return
            }

            if (data.success && Array.isArray(data.data)) {
                setAvailableSizes(data.data)
            } else {
                // Fallback to default sizes if API doesn't return expected format
                setAvailableSizes(["500ml", "1L", "1.5L", "2L"])
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "An unknown error occurred")
            toast({
                title: "Error",
                description: "Error fetching sizes:" + (error instanceof Error ? error.message : String(error)),
                variant: "destructive",
                duration: 1000,
            })
            // Fallback to default sizes
            setAvailableSizes(["500ml", "1L", "1.5L", "2L"])
        }
    }, [toast])

    const fetchProducts = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`${API_URL}/api/products`, {
                credentials: "include",
            })
            const data = await response.json()

            if (!response.ok) {
                toast({
                    title: "Error",
                    description: "Failed to fetch products" + data.message,
                    variant: "destructive",
                    duration: 1000,
                })
            }

            setProducts(data.data.products)
        } catch (error) {
            setError(error instanceof Error ? error.message : "An unknown error occurred")
            toast({
                title: "Error",
                description: "Error fetching products:" + (error instanceof Error ? error.message : String(error)),
                variant: "destructive",
                duration: 1000,
            })
        } finally {
            setIsLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchProducts()
        fetchCategories()
        fetchSizes()
    }, [fetchProducts, fetchCategories, fetchSizes])

    const filteredAndSortedProducts = useMemo(() => {
        return products
            .filter((product) => {
                const matchesSearch = product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
                const matchesCategory =
                    selectedCategories.length === 0 || product.categories.some((cat) => selectedCategories.includes(cat))
                const matchesSize = selectedSizes.length === 0 || product.sizes.some((size) => selectedSizes.includes(size))
                const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1]
                return matchesSearch && matchesCategory && matchesSize && matchesPrice
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case "price_asc":
                        return a.price - b.price
                    case "price_desc":
                        return b.price - a.price
                    case "name_asc":
                        return a.name.localeCompare(b.name)
                    case "name_desc":
                        return b.name.localeCompare(a.name)
                    default:
                        return 0
                }
            })
    }, [products, debouncedSearchTerm, selectedCategories, selectedSizes, priceRange, sortBy])

    const currentProducts = useMemo(() => {
        const indexOfLastProduct = currentPage * productsPerPage
        const indexOfFirstProduct = indexOfLastProduct - productsPerPage
        return filteredAndSortedProducts.slice(indexOfFirstProduct, indexOfLastProduct)
    }, [filteredAndSortedProducts, currentPage])

    const paginate = useCallback((pageNumber: number) => setCurrentPage(pageNumber), [])

    const clearAllFilters = () => {
        setSelectedCategories([])
        setSelectedSizes([])
        setPriceRange([0, 10000])
        setSearchTerm("")
        setSortBy("price_asc")
    }

    if (isLoading) {
        return <LoadingState />
    }

    if (error) {
        return <div className="text-center text-red-500">{error}</div>
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-4 md:mb-0">All Products</h1>
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
                            <SelectTrigger className="w-full md:w-[200px] bg-white">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                {sortOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="gap-2 hidden md:flex">
                            <Button
                                variant={viewMode === "grid" ? "default" : "outline"}
                                size="icon"
                                onClick={() => setViewMode("grid")}
                                aria-label="Grid view"
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "default" : "outline"}
                                size="icon"
                                onClick={() => setViewMode("list")}
                                aria-label="List view"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Mobile Filter Button */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="mb-4 md:hidden w-full">
                                Filters
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                            <SheetTitle> </SheetTitle>
                            <FilterContent
                                categories={categories}
                                availableSizes={availableSizes}
                                selectedCategories={selectedCategories}
                                setSelectedCategories={setSelectedCategories}
                                selectedSizes={selectedSizes}
                                setSelectedSizes={setSelectedSizes}
                                priceRange={priceRange}
                                setPriceRange={setPriceRange}
                                clearAllFilters={clearAllFilters}
                            />
                        </SheetContent>
                    </Sheet>

                    {/* Desktop Filters Sidebar */}
                    <div className="hidden md:block w-[280px] shrink-0">
                        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                            <FilterContent
                                categories={categories}
                                availableSizes={availableSizes}
                                selectedCategories={selectedCategories}
                                setSelectedCategories={setSelectedCategories}
                                selectedSizes={selectedSizes}
                                setSelectedSizes={setSelectedSizes}
                                priceRange={priceRange}
                                setPriceRange={setPriceRange}
                                clearAllFilters={clearAllFilters}
                            />
                        </div>
                    </div>

                    {/* Product Grid/List */}
                    <div className="flex-1">
                        {currentProducts.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
                                <Button onClick={clearAllFilters} className="mt-4">
                                    Clear all filters
                                </Button>
                            </div>
                        ) : (
                            <div
                                className={
                                    viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" : "space-y-6"
                                }
                            >
                                {currentProducts.map((product) => (
                                    <ProductCard key={product._id} product={product} viewMode={viewMode} />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        <div className="mt-8 flex justify-center gap-2">
                            {Array.from({ length: Math.ceil(filteredAndSortedProducts.length / productsPerPage) }).map((_, index) => (
                                <Button
                                    key={index}
                                    onClick={() => paginate(index + 1)}
                                    variant={currentPage === index + 1 ? "default" : "outline"}
                                    className={currentPage === index + 1 ? "bg-gray-900 hover:bg-gray-800" : ""}
                                >
                                    {index + 1}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

interface FilterContentProps {
    categories: Category[]
    availableSizes: string[]
    selectedCategories: string[]
    setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>
    selectedSizes: string[]
    setSelectedSizes: React.Dispatch<React.SetStateAction<string[]>>
    priceRange: number[]
    setPriceRange: React.Dispatch<React.SetStateAction<number[]>>
    clearAllFilters: () => void
}

function FilterContent({
    categories,
    availableSizes,
    selectedCategories,
    setSelectedCategories,
    selectedSizes,
    setSelectedSizes,
    priceRange,
    setPriceRange,
    clearAllFilters,
}: FilterContentProps) {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <Button variant="ghost" onClick={clearAllFilters} className="text-sm">
                    Clear all
                </Button>
            </div>
            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Categories</h4>
                <div className="space-y-3">
                    {categories.map((category) => (
                        <div key={category._id} className="flex items-center">
                            <Checkbox
                                id={`category-${category._id}`}
                                checked={selectedCategories.includes(category._id)}
                                onCheckedChange={(checked) => {
                                    setSelectedCategories((prev) =>
                                        checked ? [...prev, category._id] : prev.filter((id) => id !== category._id),
                                    )
                                }}
                                className="border-gray-300"
                            />
                            <Label htmlFor={`category-${category._id}`} className="ml-3 text-sm text-gray-600">
                                {category.name}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Sizes</h4>
                <div className="space-y-3">
                    {availableSizes.map((size) => (
                        <div key={size} className="flex items-center">
                            <Checkbox
                                id={`size-${size}`}
                                checked={selectedSizes.includes(size)}
                                onCheckedChange={(checked) => {
                                    setSelectedSizes((prev) => (checked ? [...prev, size] : prev.filter((s) => s !== size)))
                                }}
                                className="border-gray-300"
                            />
                            <Label htmlFor={`size-${size}`} className="ml-3 text-sm text-gray-600">
                                {size}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Price Range</h4>
                <Slider min={0} max={10000} step={100} value={priceRange} onValueChange={setPriceRange} className="mb-4" />
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Rs {priceRange[0].toLocaleString()}</span>
                    <span>Rs {priceRange[1].toLocaleString()}</span>
                </div>
            </div>
        </div>
    )
}

interface ProductCardProps {
    product: Product
    viewMode: "grid" | "list"
}

function ProductCard({ product, viewMode }: ProductCardProps) {
    const hasRatings = product.ratings > 0 && product.numOfReviews > 0

    return (
        <Link href={`/user/productDetail/${product._id}`}>
            <Card className={`bg-white overflow-hidden flex ${viewMode === "list" ? "flex-row" : "flex-col"} h-full`}>
                <CardHeader className={`p-0 ${viewMode === "list" ? "w-1/3" : ""}`}>
                    <div className={`relative ${viewMode === "list" ? "h-full" : "aspect-square"}`}>
                        <Image
                            src={product.images[0]?.url || "/placeholder.svg"}
                            alt={product.name}
                            layout="fill"
                            objectFit="cover"
                            loading="lazy"
                        />
                        {product.stock <= 0 && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                Out of Stock
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className={`flex-1 px-4 py-3 flex flex-col ${viewMode === "list" ? "w-2/3" : ""}`}>
                    <h3 className="font-medium text-gray-900 hover:text-gray-600 transition-colors line-clamp-2 mb-1">
                        {product.name}
                    </h3>

                    <div className="mt-auto">
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-orange-500">Rs {product.price.toLocaleString()}</span>

                            {viewMode === "list" && hasRatings && (
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm font-medium">{product.ratings.toFixed(1)}</span>
                                    <span className="text-sm text-gray-500">({product.numOfReviews})</span>
                                </div>
                            )}
                        </div>

                        {viewMode === "grid" && hasRatings && (
                            <div className="flex items-center gap-1 mt-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{product.ratings.toFixed(1)}</span>
                                <span className="text-sm text-gray-500">({product.numOfReviews})</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}

function LoadingState() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                    <div className="h-8 bg-gray-300 rounded w-1/4"></div>
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="w-full md:w-[200px] bg-gray-300 rounded h-10"></div>
                        <div className="flex gap-2">
                            <div className="w-10 h-10 bg-gray-300 rounded"></div>
                            <div className="w-10 h-10 bg-gray-300 rounded"></div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-[280px] md:shrink-0">
                        <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
                            <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                            <div className="space-y-4">
                                <div className="h-4 bg-gray-300 rounded w-full"></div>
                                <div className="h-4 bg-gray-300 rounded w-full"></div>
                                <div className="h-4 bg-gray-300 rounded w-full"></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {Array.from({ length: 12 }).map((_, index) => (
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
            </div>
        </div>
    )
}

