import Footer from "../Component/Footer";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="">
            
            {children}
            <Footer/>
        </div>
    );
}