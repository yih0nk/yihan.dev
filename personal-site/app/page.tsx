import Hero from "@/components/Hero";
import Experience from "@/components/Experience";
import Project from "@/components/Projects";
import Footer from "@/app/components/Footer";

export default function Home() {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <Hero />
        <Experience />
        <Project />
        <Footer />
      </main>
    );
}