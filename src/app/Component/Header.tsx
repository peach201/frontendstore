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

    // Ref for search container.
    const searchContainerRef = useRef<HTMLDivElement>(null)
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
    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setShowSearchResults(false)
        }

        if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
            setShowMobileSearch(false)
        }
    }, [])

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [handleClickOutside])

    // Show search results when the search term changes and is not empty.
    useEffect(() => {
        if (searchTerm.trim() !== "") {
            setShowSearchResults(true)
        } else {
            setShowSearchResults(false)
        }
    }, [searchTerm])

    return (
        <header className="bg-background sticky top-0 z-40 border-b overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="font-bold text-3xl">
                        <Image src="/logoPeach.jpg" alt="logo" width={100} height={50} />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-6">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="text-xl font-medium text-muted-foreground transition-colors hover:text-primary"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right side items */}
                    <div className="flex items-center space-x-4">
                        {/* Desktop Search */}
                        <div className="relative hidden md:block" ref={searchContainerRef}>
                            <Input
                                type="search"
                                placeholder="Search products..."
                                className="w-[300px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                // Show results on focus
                                onFocus={() => {
                                    if (searchTerm.trim() !== "") setShowSearchResults(true)
                                }}
                            />
                            {isSearching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />}
                            {showSearchResults && searchResults.length > 0 && (
                                <div className="absolute mt-2 w-full bg-background border rounded-md shadow-lg">
                                    {/*  eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {searchResults.map((product: any) => (
                                        <Link
                                            key={product._id}
                                            href={`/user/productDetail/${product._id}`}
                                            className="block px-4 py-2 hover:bg-muted"
                                            onClick={() => {
                                                setShowSearchResults(false)
                                                setSheetOpen(false)
                                            }}
                                        >
                                            {product.name}
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
                            <Button variant="ghost" size="icon" className="relative">
                                <ShoppingCart className="h-5 w-5" />
                                {getTotalItems() > 0 && (
                                    <Badge variant="destructive" className="absolute -top-2 -right-2">
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
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatar} alt={user.name} />
                                            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  
                                    <DropdownMenuItem asChild>
                                        <Link href="/user/myOrders">My Orders</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="hidden md:flex items-center space-x-2">
                                <Button asChild>
                                    <Link href="/auth/login">Login</Link>
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
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-16 px-4"
                    ref={mobileSearchRef}
                >
                    <div className="w-full max-w-md bg-background border rounded-lg shadow-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Input
                                type="search"
                                placeholder="Search products..."
                                className="flex-1"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                            <Button variant="ghost" size="icon" onClick={() => setShowMobileSearch(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {isSearching && (
                            <div className="flex justify-center py-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        )}

                        {showSearchResults && searchResults.length > 0 && (
                            <div className="max-h-[60vh] overflow-auto">
                                {/*  eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {searchResults.map((product: any) => (
                                    <Link
                                        key={product._id}
                                        href={`/user/productDetail/${product._id}`}
                                        className="block px-4 py-3 hover:bg-muted border-b last:border-0"
                                        onClick={() => {
                                            setShowSearchResults(false)
                                            setShowMobileSearch(false)
                                        }}
                                    >
                                        {product.name}
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

