import Navbar from "@/components/Navbar";
import Hero3D from "@/components/Hero3D";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import SideNav from "@/components/SideNav";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function Home() {
  return (
    <>
      <Navbar />
      <SideNav />
      <main>
        <Hero3D />
        <Projects />
        <Skills />
        <About />
        <Contact />
      </main>
      <WhatsAppButton />
    </>
  );
}
