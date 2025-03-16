"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { useEffect, useRef, useState, useCallback } from "react"
import { Loader2, Menu, Search, ShoppingCart, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { jwtDecode } from "jwt-decode"
import { useUser } from "./UserContext"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useSearch } from "@/hooks/useSearch"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useCart } from "./CartContext"
import Image from "next/image"

interface DecodedToken {
    exp: number
    id: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.peachflask.com"

export default function Header() {
    const { toast } = useToast()
    const router = useRouter()
    const { user, setUser } = useUser()
    const [isLoading, setIsLoading] = useState(true)
    const { searchTerm, setSearchTerm, searchResults, isLoading: isSearching } = useSearch()
    const { getTotalItems } = useCart()
    // New state to control search dropdown visibility.
    const [showSearchResults, setShowSearchResults] = useState(false)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [showMobileSearch, setShowMobileSearch] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)

    // Debug state to check search results
    interface Product {
        _id: string;
        name: string;
        price: number;
        images?: Array<{ url: string }>;
    }
    const [, setDebugResults] = useState<Product[]>([])

    // Ref for search container.
    const searchContainerRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const mobileSearchRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const checkAuthState = () => {
            const token = document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, "$1")
            if (!token) return null

            try {
                const decoded = jwtDecode<DecodedToken>(token)
                const currentTime = Date.now() / 1000
                if (decoded.exp < currentTime) return null
                const storedUser = localStorage.getItem("user")
                return storedUser ? JSON.parse(storedUser) : null
            } catch {
                return null
            }
        }

        const checkAuth = async () => {
            try {
                const localUser = checkAuthState()
                if (localUser) {
                    setUser(localUser)
                    setIsLoading(false)
                    return
                }

                const response = await fetch(`${API_URL}/api/auth/me`, {
                    credentials: "include",
                })

                if (response.ok) {
                    const userData = await response.json()
                    setUser(userData.data)
                    localStorage.setItem("user", JSON.stringify(userData.data))
                }
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
                toast({
                    title: "Error",
                    description: "Auth check failed: " + errorMessage,
                    variant: "destructive",
                    duration: 1000,
                })
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()
    }, [setUser, toast])

    // Update debug results when searchResults change
    useEffect(() => {
        if (searchResults && searchResults.length > 0) {
            setDebugResults(searchResults)
            setShowSearchResults(true)
        } else {
            setShowSearchResults(false)
        }
    }, [searchResults])

    const handleLogout = async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
            })

            if (response.ok) {
                localStorage.removeItem("user")
                setUser(null)
                router.push("/auth/login")
                toast({
                    title: "Logged out successfully",
                    duration: 1000,
                })
            }
        } catch {
            toast({
                variant: "destructive",
                title: "Logout failed",
                description: "Please try again",
                duration: 1000,
            })
        }
    }

    const navItems = [
        { label: "Home", href: "/" },
        { label: "Products", href: "/user/allProduct" },
        { label: "About", href: "/user/about" },
        { label: "Contact", href: "/user/contact" },
    ]

    // Handle clicks outside the search container.
    const handleClickOutside = useCallback(
        (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSearchResults(false)
                // Only close search if it's empty
                if (!searchTerm.trim()) {
                    setIsSearchOpen(false)
                }
            }

            if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
                setShowMobileSearch(false)
            }
        },
        [searchTerm],
    )

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [handleClickOutside])

    // Close search when ESC key is pressed
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsSearchOpen(false)
                setShowSearchResults(false)
                setSearchTerm("")
            }
        }

        window.addEventListener("keydown", handleEsc)
        return () => {
            window.removeEventListener("keydown", handleEsc)
        }
    }, [setSearchTerm])

    return (
        <header className="bg-background sticky top-0 z-40 border-b ">
            <div className="container mx-auto px-4 relative">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="font-bold text-3xl">
                        <Image src="/logoPeach.jpg" alt="logo" width={100} height={30} />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center justify-center space-x-8 flex-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="text-base font-medium text-black transition-colors hover:text-primary relative group"
                            >
                                {item.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                            </Link>
                        ))}
                    </nav>

                    {/* Right side items */}
                    <div className="flex items-center space-x-4">
                        {/* Desktop Search */}
                        <div className="relative hidden md:block" ref={searchContainerRef}>
                            <div className="flex items-center">
                                {isSearchOpen ? (
                                    <div className="flex items-center w-[300px] transition-all duration-300">
                                        <Input
                                            ref={searchInputRef}
                                            type="search"
                                            placeholder="Search products..."
                                            className="w-full"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="ml-1"
                                            onClick={() => {
                                                setSearchTerm("")
                                                setIsSearchOpen(false)
                                                setShowSearchResults(false)
                                            }}
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setIsSearchOpen(true)
                                            // Focus will be set after the input renders
                                            setTimeout(() => {
                                                if (searchInputRef.current) {
                                                    searchInputRef.current.focus()
                                                }
                                            }, 10)
                                        }}
                                    >
                                        <Search className="h-5 w-5 z-10" />
                                    </Button>
                                )}
                                {isSearching && <Loader2 className="absolute right-10 top-3 h-4 w-4 animate-spin " />}
                            </div>

                            {isSearchOpen && showSearchResults && searchResults && searchResults.length > 0 && (
                                <div className="absolute mt-2 w-[300px] right-0 bg-background border rounded-md shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 z-80">
                                    {searchResults.map((product: Product) => (
                                        <Link
                                            key={product._id}
                                            href={`/user/productDetail/${product._id}`}
                                            className="flex items-center gap-3 p-3 hover:bg-muted transition-colors "
                                            onClick={() => {
                                                setShowSearchResults(false)
                                                setSearchTerm("")
                                                setIsSearchOpen(false)
                                            }}
                                        >
                                            {product.images && product.images[0] && (
                                                <div className="h-12 w-12 rounded overflow-hidden flex-shrink-0">
                                                    <Image
                                                        src={product.images[0].url || "/placeholder.svg"}
                                                        alt={product.name}
                                                        width={48}
                                                        height={48}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{product.name}</p>
                                                <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Mobile Search Button */}
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowMobileSearch(true)}>
                            <Search className="h-5 w-5" />
                        </Button>

                        <Link href="/user/cart">
                            <Button variant="ghost" size="icon" className="relative transition-transform hover:scale-110">
                                <ShoppingCart className="h-5 w-5" />
                                {getTotalItems() > 0 && (
                                    <Badge variant="destructive" className="absolute -top-2 -right-2 animate-in zoom-in-95 duration-200">
                                        {getTotalItems()}
                                    </Badge>
                                )}
                            </Button>
                        </Link>
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="relative h-8 w-8 rounded-full overflow-hidden transition-transform hover:scale-110"
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatar} alt={user.name} />
                                            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="animate-in fade-in-0 zoom-in-95 duration-200">
                                    <DropdownMenuItem asChild>
                                        <Link href="/user/myOrders">My Orders</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="hidden md:block">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative overflow-hidden transition-transform hover:scale-110"
                                    asChild
                                >
                                    <Link href="/auth/login">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="h-5 w-5"
                                        >
                                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    </Link>
                                </Button>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSheetOpen(true)}>
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetTitle></SheetTitle>
                            <SheetContent side="right">
                                <nav className="flex flex-col space-y-4">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                                            onClick={() => setSheetOpen(false)}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                    {!user && (
                                        <div className="flex flex-col space-y-2 pt-4">
                                            <Button variant="outline" asChild>
                                                <Link href="/auth/login" onClick={() => setSheetOpen(false)}>
                                                    Login
                                                </Link>
                                            </Button>
                                            <Button asChild>
                                                <Link href="/auth/signup" onClick={() => setSheetOpen(false)}>
                                                    Sign Up
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>

            {/* Mobile Search Popup */}
            {showMobileSearch && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-16 px-4 animate-in fade-in-0 duration-200"
                    ref={mobileSearchRef}
                >
                    <div className="w-full max-w-md bg-background border rounded-lg shadow-lg p-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Input
                                type="search"
                                placeholder="Search products..."
                                className="flex-1"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setShowMobileSearch(false)
                                    setSearchTerm("")
                                }}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {isSearching && (
                            <div className="flex justify-center py-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        )}

                        {showSearchResults && searchResults && searchResults.length > 0 && (
                            <div className="max-h-[60vh] overflow-auto">
                                {searchResults.map((product: Product) => (
                                    <Link
                                        key={product._id}
                                        href={`/user/productDetail/${product._id}`}
                                        className="flex items-center gap-3 p-3 hover:bg-muted transition-colors border-b last:border-0"
                                        onClick={() => {
                                            setShowSearchResults(false)
                                            setShowMobileSearch(false)
                                            setSearchTerm("")
                                        }}
                                    >
                                        {product.images && product.images[0] && (
                                            <div className="h-12 w-12 rounded overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={product.images[0].url || "/placeholder.svg"}
                                                    alt={product.name}
                                                    width={48}
                                                    height={48}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{product.name}</p>
                                            <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    )
}