"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Facebook, Twitter, Instagram } from "lucide-react"

interface PromotionBarProps {
    messages: string[]
    backgroundColor?: string
    textColor?: string
    showSocialIcons?: boolean
    autoRotate?: boolean
    rotationInterval?: number
}

export default function PromotionBar({
    messages,
    backgroundColor = "#3A3A3A",
    textColor = "white",
    showSocialIcons = false,
    autoRotate = true,
    rotationInterval = 5000,
}: PromotionBarProps) {
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        if (!autoRotate || messages.length <= 1) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % messages.length)
        }, rotationInterval)

        return () => clearInterval(interval)
    }, [autoRotate, messages.length, rotationInterval])

    return (
        <div className="pl-8 py-2 overflow-hidden" style={{ backgroundColor, color: textColor }}>
            <div className="container mx-auto px-4 flex justify-between items-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="text-center flex-1 font-medium"
                    >
                        {messages[currentIndex]}
                    </motion.div>
                </AnimatePresence>

                {showSocialIcons && (
                    <div className="md:flex lg:flex space-x-4 ml-4 shrink-0 hidden ">
                        <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
                            <Facebook className="h-5 w-5" />
                        </a>
                        <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">
                            <Twitter className="h-5 w-5" />
                        </a>
                        <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
                            <Instagram className="h-5 w-5" />
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}

