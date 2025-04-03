"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface Category {
    _id: string
    name: string
    description: string
    isActive: boolean
}

interface Settings {
    _id: string
    shippingFee: number
}

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://ecommercepeachflask-git-main-husnain-alis-projects-dbd16c4d.vercel.app"

export default function StoreSettings() {
    const [categories, setCategories] = useState<Category[]>([])
    const [settings, setSettings] = useState<Settings | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false)
    const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false)
    const [isEditShippingDialogOpen, setIsEditShippingDialogOpen] = useState(false)
    const [currentCategory, setCurrentCategory] = useState<Category | null>(null)
    const [newCategory, setNewCategory] = useState({ name: "", description: "", isActive: true })
    const [newShippingFee, setNewShippingFee] = useState(0)
    const { toast } = useToast()

    // Size management states
    const [sizes, setSizes] = useState<string[]>([])
    const [isLoadingSizes, setIsLoadingSizes] = useState(false)
    const [isAddSizeDialogOpen, setIsAddSizeDialogOpen] = useState(false)
    const [isEditSizeDialogOpen, setIsEditSizeDialogOpen] = useState(false)
    const [newSize, setNewSize] = useState("")
    const [currentSize, setCurrentSize] = useState("")
    const [editedSize, setEditedSize] = useState("")

    const fetchCategories = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`${API_URL}/api/categories`, {
                credentials: "include",
            })
            const data = await response.json()

            if (!response.ok) {
                toast({
                    title: "Error",
                    description: "Failed to fetch categories",
                    variant: "destructive",
                    duration: 1000,
                })
            }

            setCategories(Array.isArray(data) ? data : [])
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to fetch categories",
                duration: 1000,
            })
        } finally {
            setIsLoading(false)
        }
    }, [toast])

    const fetchSettings = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/settings`, {
                credentials: "include",
            })
            const data = await response.json()

            if (!response.ok) {
                toast({
                    title: "Error",
                    description: "Failed to fetch shipping",
                    variant: "destructive",
                    duration: 1000,
                })
            }

            setSettings(data)
            setNewShippingFee(data.shippingFee)
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to fetch settings",
                duration: 1000,
            })
        }
    }, [toast])

    const fetchSizes = useCallback(async () => {
        setIsLoadingSizes(true)
        try {
            const response = await fetch(`${API_URL}/api/products/sizes/all`, {
                credentials: "include",
            })
            const data = await response.json()

            if (!response.ok) {
                toast({
                    title: "Error",
                    description: "Failed to fetch sizes",
                    variant: "destructive",
                    duration: 1000,
                })
                return
            }

            setSizes(data.data || [])
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to fetch sizes",
                duration: 1000,
            })
        } finally {
            setIsLoadingSizes(false)
        }
    }, [toast])

    useEffect(() => {
        fetchCategories()
        fetchSettings()
        fetchSizes()
    }, [fetchCategories, fetchSettings, fetchSizes])

    const handleDeleteCategory = async (categoryId: string) => {
        try {
            const response = await fetch(`${API_URL}/api/categories/${categoryId}`, {
                method: "DELETE",
                credentials: "include",
            })
            if (response.ok) {
                fetchCategories()
                toast({
                    title: "Success",
                    description: "Category deleted successfully",
                    duration: 1000,
                })
            } else {
                toast({
                    title: "Error",
                    description: "Failed to delete category",
                    variant: "destructive",
                    duration: 1000,
                })
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete category",
                duration: 1000,
            })
        }
    }

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch(`${API_URL}/api/categories`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(newCategory),
            })
            if (response.ok) {
                fetchCategories()
                setIsAddCategoryDialogOpen(false)
                setNewCategory({ name: "", description: "", isActive: true })
                toast({
                    title: "Success",
                    description: "Category added successfully",
                    duration: 1000,
                })
            } else {
                toast({
                    title: "Error",
                    description: "Failed to add category",
                    variant: "destructive",
                    duration: 1000,
                })
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add category",
                duration: 1000,
            })
        }
    }

    const handleUpdateCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentCategory) return
        try {
            const response = await fetch(`${API_URL}/api/categories/${currentCategory._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(currentCategory),
            })
            if (response.ok) {
                fetchCategories()
                setIsEditCategoryDialogOpen(false)
                setCurrentCategory(null)
                toast({
                    title: "Success",
                    description: "Category updated successfully",
                    duration: 1000,
                })
            } else {
                toast({
                    title: "Error",
                    description: "Failed to update category",
                    variant: "destructive",
                    duration: 1000,
                })
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update category",
                duration: 1000,
            })
        }
    }

    const handleUpdateShipping = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!settings) return
        try {
            const response = await fetch(`${API_URL}/api/settings`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ ...settings, shippingFee: newShippingFee }),
            })
            if (response.ok) {
                fetchSettings()
                setIsEditShippingDialogOpen(false)
                toast({
                    title: "Success",
                    description: "Shipping fee updated successfully",
                    duration: 1000,
                })
            } else {
                toast({
                    title: "Error",
                    description: "Failed to update shipping fee",
                    variant: "destructive",
                    duration: 1000,
                })
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update shipping fee",
                duration: 1000,
            })
        }
    }

    // Size management handlers
    const handleAddSize = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSize.trim()) {
            toast({
                title: "Error",
                description: "Size cannot be empty",
                variant: "destructive",
                duration: 1000,
            })
            return
        }

        try {
            // Add the new size to the existing sizes
            const updatedSizes = [...sizes, newSize]

            const response = await fetch(`${API_URL}/api/products/sizes/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ newSizes: updatedSizes }),
            })

            if (response.ok) {
                fetchSizes()
                setIsAddSizeDialogOpen(false)
                setNewSize("")
                toast({
                    title: "Success",
                    description: "Size added successfully",
                    duration: 1000,
                })
            } else {
                const data = await response.json()
                toast({
                    title: "Error",
                    description: data.message || "Failed to add size",
                    variant: "destructive",
                    duration: 1000,
                })
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add size",
                duration: 1000,
            })
        }
    }

    const handleUpdateSize = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editedSize.trim()) {
            toast({
                title: "Error",
                description: "Size cannot be empty",
                variant: "destructive",
                duration: 1000,
            })
            return
        }

        try {
            // Replace the current size with the edited size
            const updatedSizes = sizes.map((size) => (size === currentSize ? editedSize : size))

            const response = await fetch(`${API_URL}/api/products/sizes/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ newSizes: updatedSizes }),
            })

            if (response.ok) {
                fetchSizes()
                setIsEditSizeDialogOpen(false)
                setCurrentSize("")
                setEditedSize("")
                toast({
                    title: "Success",
                    description: "Size updated successfully",
                    duration: 1000,
                })
            } else {
                const data = await response.json()
                toast({
                    title: "Error",
                    description: data.message || "Failed to update size",
                    variant: "destructive",
                    duration: 1000,
                })
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update size",
                duration: 1000,
            })
        }
    }

    const handleDeleteSize = async (sizeToDelete: string) => {
        if (!confirm(`Are you sure you want to delete the size "${sizeToDelete}"?`)) {
            return
        }

        try {
            // Filter out the size to delete
            const updatedSizes = sizes.filter((size) => size !== sizeToDelete)

            const response = await fetch(`${API_URL}/api/products/sizes/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ newSizes: updatedSizes }),
            })

            if (response.ok) {
                fetchSizes()
                toast({
                    title: "Success",
                    description: "Size deleted successfully",
                    duration: 1000,
                })
            } else {
                const data = await response.json()
                toast({
                    title: "Error",
                    description: data.message || "Failed to delete size",
                    variant: "destructive",
                    duration: 1000,
                })
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete size",
                duration: 1000,
            })
        }
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-5">Store Settings</h1>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">Shipping</h2>
                {settings ? (
                    <div className="flex items-center gap-4">
                        <p className="text-lg">
                            Current Shipping Fee: Rs {settings.shippingFee ? settings.shippingFee.toFixed(2) : "N/A"}
                        </p>
                        <Dialog open={isEditShippingDialogOpen} onOpenChange={setIsEditShippingDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">Update Shipping Fee</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Update Shipping Fee</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleUpdateShipping} className="space-y-4">
                                    <div>
                                        <Label htmlFor="shippingFee">New Shipping Fee (Rs)</Label>
                                        <Input
                                            id="shippingFee"
                                            type="number"
                                            value={newShippingFee}
                                            onChange={(e) => setNewShippingFee(Number(e.target.value))}
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>
                                    <Button type="submit">Update</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                ) : (
                    <p>Loading shipping information...</p>
                )}
            </div>

            {/* Product Sizes Section */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">Product Sizes</h2>
                <div className="mb-4 flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Manage available product sizes</p>
                    <Dialog open={isAddSizeDialogOpen} onOpenChange={setIsAddSizeDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>Add New Size</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Size</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddSize} className="space-y-4">
                                <div>
                                    <Label htmlFor="newSize">Size (e.g., 500ml, 1L)</Label>
                                    <Input
                                        id="newSize"
                                        value={newSize}
                                        onChange={(e) => setNewSize(e.target.value)}
                                        placeholder="Enter size"
                                    />
                                </div>
                                <Button type="submit">Add Size</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Size</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingSizes ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">
                                    Loading sizes...
                                </TableCell>
                            </TableRow>
                        ) : sizes.length > 0 ? (
                            sizes.map((size) => (
                                <TableRow key={size}>
                                    <TableCell>{size}</TableCell>
                                    <TableCell className="text-right">
                                        <Dialog
                                            open={isEditSizeDialogOpen && currentSize === size}
                                            onOpenChange={(open) => {
                                                setIsEditSizeDialogOpen(open)
                                                if (!open) {
                                                    setCurrentSize("")
                                                    setEditedSize("")
                                                }
                                            }}
                                        >
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="mr-2"
                                                    onClick={() => {
                                                        setCurrentSize(size)
                                                        setEditedSize(size)
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Edit Size</DialogTitle>
                                                </DialogHeader>
                                                <form onSubmit={handleUpdateSize} className="space-y-4">
                                                    <div>
                                                        <Label htmlFor="editSize">Size</Label>
                                                        <Input id="editSize" value={editedSize} onChange={(e) => setEditedSize(e.target.value)} />
                                                    </div>
                                                    <Button type="submit">Update Size</Button>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                        <Button variant="outline" size="icon" onClick={() => handleDeleteSize(size)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">
                                    No sizes found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-3">Categories</h2>
                <div className="mb-4 flex justify-between items-center">
                    <Input className="max-w-sm" placeholder="Search categories..." />
                    <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>Add New Category</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Category</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddCategory} className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={newCategory.name}
                                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        value={newCategory.description}
                                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isActive"
                                        checked={newCategory.isActive}
                                        onCheckedChange={(checked) => setNewCategory({ ...newCategory, isActive: checked })}
                                    />
                                    <Label htmlFor="isActive">Active</Label>
                                </div>
                                <Button type="submit">Add Category</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : Array.isArray(categories) && categories.length > 0 ? (
                            categories.map((category) => (
                                <TableRow key={category._id}>
                                    <TableCell>{category.name}</TableCell>
                                    <TableCell>{category.description}</TableCell>
                                    <TableCell>{category.isActive ? "Active" : "Inactive"}</TableCell>
                                    <TableCell>
                                        <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="mr-2"
                                                    onClick={() => setCurrentCategory(category)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Edit Category</DialogTitle>
                                                </DialogHeader>
                                                {currentCategory && (
                                                    <form onSubmit={handleUpdateCategory} className="space-y-4">
                                                        <div>
                                                            <Label htmlFor="editName">Name</Label>
                                                            <Input
                                                                id="editName"
                                                                value={currentCategory.name}
                                                                onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="editDescription">Description</Label>
                                                            <Input
                                                                id="editDescription"
                                                                value={currentCategory.description}
                                                                onChange={(e) =>
                                                                    setCurrentCategory({ ...currentCategory, description: e.target.value })
                                                                }
                                                            />
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Switch
                                                                id="editIsActive"
                                                                checked={currentCategory.isActive}
                                                                onCheckedChange={(checked) =>
                                                                    setCurrentCategory({ ...currentCategory, isActive: checked })
                                                                }
                                                            />
                                                            <Label htmlFor="editIsActive">Active</Label>
                                                        </div>
                                                        <Button type="submit">Update Category</Button>
                                                    </form>
                                                )}
                                            </DialogContent>
                                        </Dialog>
                                        <Button variant="outline" size="icon" onClick={() => handleDeleteCategory(category._id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">
                                    No categories found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

