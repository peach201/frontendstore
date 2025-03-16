import HeroSection from "./Component/HeroSection"
import Features from "./Component/Features"
import Footer from "./Component/Footer"
import ProductGrid from "./Component/OurProducts"
import MarqueeBar from "./Component/MarqueeBar"

export default function Home() {
  return (
    <>
      <HeroSection />
      <MarqueeBar
        messages={[
          "Welcome to Peach Flask Store - Your one-stop shop for premium water bottles!",
          "Discover our wide range of eco-friendly and stylish water bottles.",
          "End Of Season Sale Is Live!!",
          "Buy Any 3 & Get Free Shipping + Rs. 500 off!!",
        ]}
      />
      <Features />
      <ProductGrid />
      <Footer />
    </>
  )
}

