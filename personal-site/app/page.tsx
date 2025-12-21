import Hero from "@/components/Hero";
import Experience from "@/components/Experience";
import Project from "@/components/Projects";
import Contact from "@/components/Contact";

export default function Home() {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <Hero />
        <Experience />
        <Project />
        <Contact />
      </main>
    );
}