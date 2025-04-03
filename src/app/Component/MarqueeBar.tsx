"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Facebook, Twitter, Instagram } from "lucide-react"

interface MarqueeBarProps {
    messages: string[]
    backgroundColor?: string
    textColor?: string
    showSocialIcons?: boolean
    speed?: number
}

export default function MarqueeBar({
    messages,
    backgroundColor = "#3A3A3A",
    textColor = "white",
    showSocialIcons = false,
     // pixels per second
}: MarqueeBarProps) {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

    // Rotate through messages every 10 seconds
    useEffect(() => {
        if (messages.length <= 1) return

        const interval = setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
        }, 10000)

        return () => clearInterval(interval)
    }, [messages.length])

    return (
        <div className="py-2 overflow-hidden w-full " style={{ backgroundColor, color: textColor }}>
            <div className="container w-full px-4 flex justify-between items-center">
                <div className="overflow-hidden flex-1">
                    <motion.div
                        key={currentMessageIndex}
                        initial={{ x: "100%" }}
                        animate={{ x: "-100%" }}
                        transition={{
                            duration: 15,
                            ease: "linear",
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: "loop",
                        }}
                        className="whitespace-nowrap"
                    >
                        {messages[currentMessageIndex]}
                    </motion.div>
                </div>

                {showSocialIcons && (
                    <div className="flex space-x-4 ml-4 shrink-0">
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

