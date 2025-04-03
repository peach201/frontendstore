import { Star } from "lucide-react"

interface Review {
    rating: number
    // Add other review properties as needed
}

export default function ReviewSection({ reviews }: { reviews: Review[] }) {
    const numOfReviews = reviews.length

    // Calculate average rating and rating distribution
    const productRating = numOfReviews > 0 ? reviews.reduce((acc, review) => acc + review.rating, 0) / numOfReviews : 0

    const ratingCounts = [0, 0, 0, 0, 0]
    reviews.forEach((review) => {
        if (review.rating >= 1 && review.rating <= 5) {
            ratingCounts[review.rating - 1]++
        }
    })

    if (!reviews || reviews.length === 0) {
        return (
            <div className="py-10 text-center">
                <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-8 shadow-sm">
                    <Star className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">No Reviews Yet</h3>
                    <p className="text-gray-600 text-lg mb-4">Be the first to share your experience with this product!</p>
                </div>
            </div>
        )
    }

    return (
        <div className="py-4">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Left side - Overall rating */}
                <div className="md:w-1/3">
                    <div className="flex flex-col items-center">
                        <div className="text-5xl font-bold text-gray-800">
                            {productRating.toFixed(1)}
                            <span className="text-2xl text-gray-500">/5</span>
                        </div>
                        <div className="flex items-center my-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-8 h-8 ${star <= Math.round(productRating) ? "text-yellow-400 fill-current" : "text-gray-200"}`}
                                />
                            ))}
                        </div>
                        <div className="text-gray-600 font-medium">
                            {numOfReviews} {numOfReviews === 1 ? "Rating" : "Ratings"}
                        </div>
                    </div>
                </div>

                {/* Right side - Rating breakdown */}
                <div className="md:w-2/3">
                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const count = ratingCounts[rating - 1]
                            const percentage = numOfReviews > 0 ? (count / numOfReviews) * 100 : 0

                            return (
                                <div key={rating} className="flex items-center gap-2">
                                    <div className="flex items-center w-24">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-4 h-4 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-200"}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex-1 h-5 bg-gray-200 rounded-sm overflow-hidden">
                                        <div className="h-full bg-yellow-400" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                    <div className="w-8 text-right font-medium">{count}</div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="mt-6 flex justify-between items-center">
                        <h3 className="text-xl font-bold">Product Reviews</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600">Sort:</span>
                                <span className="font-medium">Relevance</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

